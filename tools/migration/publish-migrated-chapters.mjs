/**
 * One-off corrective script: publish the 33 chapters of "Шум дождя" that were
 * created as `draft` by the initial --import run.
 *
 * Safety filters (all must be satisfied before any row is updated):
 *   - book_id   = known "Шум дождя" UUID
 *   - status    = 'draft'
 *   - legacy_wp_id IS NOT NULL  (proves migration origin, not a manual CMS chapter)
 *
 * Fields changed: status only (draft → published).
 * Fields preserved: everything else.
 *
 * Usage (inspect — no writes):
 *   node --env-file=.env.local tools/migration/publish-migrated-chapters.mjs
 *
 * Usage (apply):
 *   node --env-file=.env.local tools/migration/publish-migrated-chapters.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";

const BOOK_ID = "aaab620c-70eb-4194-adda-5c7bd9ce1175";
const BOOK_TITLE = "Шум дождя";

const apply = process.argv.includes("--apply");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
    process.exitCode = 1;
    process.exit();
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

// ── 1. Verify book ────────────────────────────────────────────────────────────

const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("id, title")
    .eq("id", BOOK_ID)
    .maybeSingle();
if (bookErr) throw bookErr;
if (!book) {
    console.error(`Book not found: id=${BOOK_ID}`);
    process.exitCode = 1;
    process.exit();
}
if (book.title !== BOOK_TITLE) {
    console.error(`Title mismatch: expected "${BOOK_TITLE}", found "${book.title}"`);
    process.exitCode = 1;
    process.exit();
}
console.log(`\nBook verified: "${book.title}" (id: ${book.id})`);

// ── 2. Find all chapters in scope ─────────────────────────────────────────────
// Scope: draft chapters with a legacy_wp_id (migration-created, not manual CMS)

const { data: allChapters, error: allErr } = await supabase
    .from("chapters")
    .select("id, title, slug, sort_order, status, legacy_wp_id")
    .eq("book_id", BOOK_ID)
    .order("sort_order", { ascending: true });
if (allErr) throw allErr;

const targetChapters = allChapters.filter(
    (ch) => ch.status === "draft" && ch.legacy_wp_id != null
);
const alreadyPublished = allChapters.filter((ch) => ch.status === "published");
const manualDrafts = allChapters.filter(
    (ch) => ch.status === "draft" && ch.legacy_wp_id == null
);

console.log(`\nAll chapters in book: ${allChapters.length}`);
console.log(`  Already published:      ${alreadyPublished.length}`);
console.log(`  Migration drafts (target): ${targetChapters.length}`);
console.log(`  Manual CMS drafts (skip):  ${manualDrafts.length}`);

if (targetChapters.length === 0) {
    console.log(`\n✓ No migration draft chapters found. Nothing to do.`);
    process.exit();
}

console.log(`\nChapters to be published:`);
for (const ch of targetChapters) {
    console.log(`  [${ch.sort_order}] ${ch.title} (wp_id: ${ch.legacy_wp_id})`);
}

if (manualDrafts.length > 0) {
    console.log(`\nChapters skipped (no legacy_wp_id — manual CMS, not migration):`);
    for (const ch of manualDrafts) {
        console.log(`  [${ch.sort_order}] ${ch.title}`);
    }
}

if (!apply) {
    console.log(`\nDry-inspect complete. To apply, rerun with --apply.`);
    process.exit();
}

// ── 3. Apply: set status = 'published' on target chapters ────────────────────

const targetIds = targetChapters.map((ch) => ch.id);

const { error: updateErr } = await supabase
    .from("chapters")
    .update({ status: "published" })
    .in("id", targetIds);
if (updateErr) throw updateErr;

console.log(`\n✓ Updated ${targetChapters.length} chapters: draft → published.`);

// ── 4. Verification ───────────────────────────────────────────────────────────

const { data: verified, error: verifyErr } = await supabase
    .from("chapters")
    .select("id, title, sort_order, status, legacy_wp_id")
    .eq("book_id", BOOK_ID)
    .order("sort_order", { ascending: true });
if (verifyErr) throw verifyErr;

const stillDraft = verified.filter((ch) => ch.status === "draft");
const nowPublished = verified.filter((ch) => ch.status === "published");

console.log(`\nVerification — all ${verified.length} chapters:`);
for (const ch of verified) {
    const icon = ch.status === "published" ? "✓" : "⚠";
    const wpLabel = ch.legacy_wp_id != null ? `wp_id:${ch.legacy_wp_id}` : "no wp_id";
    console.log(`  ${icon} [${ch.sort_order}] ${ch.title} — ${ch.status} (${wpLabel})`);
}

console.log(`\nSummary:`);
console.log(`  Total chapters:  ${verified.length}`);
console.log(`  Published:       ${nowPublished.length}`);
console.log(`  Still draft:     ${stillDraft.length}`);

if (stillDraft.length > 0) {
    console.log(`\n  Remaining drafts (manual CMS chapters — not modified by this script):`);
    for (const ch of stillDraft) {
        console.log(`    [${ch.sort_order}] ${ch.title}`);
    }
}
