/**
 * One-off script: attach legacy WordPress identity to DB chapters #2 and #3
 * of "Шум дождя" (already verified as exact copies of their WP source posts).
 *
 * Usage (inspect only — no writes):
 *   node --env-file=.env.local tools/migration/register-chapters-2-3.mjs
 *
 * Usage (apply):
 *   node --env-file=.env.local tools/migration/register-chapters-2-3.mjs --apply
 *
 * Fields modified: legacy_wp_id, legacy_url only.
 * Fields preserved: id, title, slug, sort_order, status, content, book_id.
 */

import { createClient } from "@supabase/supabase-js";

const BOOK_ID = "aaab620c-70eb-4194-adda-5c7bd9ce1175";
const BOOK_TITLE = "Шум дождя";

const CHAPTERS = [
    {
        id: "22d1a3fd-7271-4628-82f2-32f3ed5f002e",
        expectedTitle: "Глава 2. Попробуй мне отказать.",
        expectedSortOrder: 2,
        legacyWpId: 204,
        legacyUrl: "https://transmagia.house/%D0%B3%D0%BB%D0%B0%D0%B2%D0%B0-2-%D0%BF%D0%BE%D0%BF%D1%80%D0%BE%D0%B1%D1%83%D0%B9-%D0%BC%D0%BD%D0%B5-%D0%BE%D1%82%D0%BA%D0%B0%D0%B7%D0%B0%D1%82%D1%8C/",
    },
    {
        id: "8c53bd96-6c8f-4e42-9c50-318fe94cee70",
        expectedTitle: "Глава 3.Побег из бара.",
        expectedSortOrder: 3,
        legacyWpId: 211,
        legacyUrl: "https://transmagia.house/%D0%B3%D0%BB%D0%B0%D0%B2%D0%B0-3-%D0%BF%D0%BE%D0%B1%D0%B5%D0%B3-%D0%B8%D0%B7-%D0%B1%D0%B0%D1%80%D0%B0/",
    },
];

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

// ── 1. Verify book exists ─────────────────────────────────────────────────────

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

// ── 2. Verify and plan each chapter ──────────────────────────────────────────

const plan = [];

for (const spec of CHAPTERS) {
    const { data: ch, error: chErr } = await supabase
        .from("chapters")
        .select("id, title, slug, sort_order, status, legacy_wp_id, legacy_url, book_id")
        .eq("id", spec.id)
        .maybeSingle();
    if (chErr) throw chErr;

    if (!ch) {
        console.error(`\n✗ Chapter not found: id=${spec.id}`);
        process.exitCode = 1;
        process.exit();
    }
    if (ch.book_id !== BOOK_ID) {
        console.error(`\n✗ Chapter id=${spec.id} belongs to book ${ch.book_id}, not ${BOOK_ID}. Aborting.`);
        process.exitCode = 1;
        process.exit();
    }
    if (ch.title !== spec.expectedTitle) {
        console.error(`\n✗ Title mismatch for id=${spec.id}: expected "${spec.expectedTitle}", found "${ch.title}". Aborting.`);
        process.exitCode = 1;
        process.exit();
    }
    if (ch.sort_order !== spec.expectedSortOrder) {
        console.error(`\n✗ sort_order mismatch for id=${spec.id}: expected ${spec.expectedSortOrder}, found ${ch.sort_order}. Aborting.`);
        process.exitCode = 1;
        process.exit();
    }

    // Safety: ensure exactly 1 row matches this ID
    const { count, error: countErr } = await supabase
        .from("chapters")
        .select("id", { count: "exact", head: true })
        .eq("id", spec.id);
    if (countErr) throw countErr;
    if (count !== 1) {
        console.error(`\n✗ Expected exactly 1 chapter with id=${spec.id}, found ${count}. Aborting.`);
        process.exitCode = 1;
        process.exit();
    }

    const urlAlreadySet = ch.legacy_url === spec.legacyUrl;
    const wpIdAlreadySet = ch.legacy_wp_id === spec.legacyWpId;

    console.log(`\nChapter sort_order=${ch.sort_order}: "${ch.title}"`);
    console.log(`  id:              ${ch.id}`);
    console.log(`  slug:            ${ch.slug}`);
    console.log(`  status:          ${ch.status}`);
    console.log(`  legacy_wp_id:    ${ch.legacy_wp_id ?? "(null)"} → ${spec.legacyWpId}`);
    console.log(`  legacy_url:      ${ch.legacy_url ?? "(null)"} → ${spec.legacyUrl}`);

    if (urlAlreadySet && wpIdAlreadySet) {
        console.log(`  ✓ Already correct — no update needed.`);
        plan.push({ spec, ch, skip: true });
    } else {
        plan.push({ spec, ch, skip: false });
    }
}

if (plan.every(p => p.skip)) {
    console.log(`\n✓ All legacy identities already correct. No changes needed.`);
    process.exit();
}

if (!apply) {
    console.log(`\nDry-inspect complete. To apply the updates, rerun with --apply.`);
    process.exit();
}

// ── 3. Apply ──────────────────────────────────────────────────────────────────

console.log(`\nApplying updates...`);

for (const { spec, skip } of plan) {
    if (skip) {
        console.log(`  ↩ sort_order=${spec.expectedSortOrder}: already correct, skipped.`);
        continue;
    }

    const { error: updateErr } = await supabase
        .from("chapters")
        .update({ legacy_wp_id: spec.legacyWpId, legacy_url: spec.legacyUrl })
        .eq("id", spec.id);
    if (updateErr) throw updateErr;

    console.log(`  ✓ sort_order=${spec.expectedSortOrder} (id: ${spec.id}): legacy_wp_id=${spec.legacyWpId}, legacy_url set.`);
}

// ── 4. Verification query ─────────────────────────────────────────────────────

console.log(`\nVerification — all chapters of "${BOOK_TITLE}":`);
const { data: allChapters, error: verifyErr } = await supabase
    .from("chapters")
    .select("id, title, slug, sort_order, status, legacy_wp_id, legacy_url")
    .eq("book_id", BOOK_ID)
    .order("sort_order", { ascending: true });
if (verifyErr) throw verifyErr;

console.log(`  Total: ${allChapters.length}`);
for (const ch of allChapters) {
    const wpOk = ch.legacy_wp_id != null ? "✓" : "✗";
    const urlOk = ch.legacy_url != null ? "✓" : "✗";
    console.log(`  [${ch.sort_order}] ${ch.title}`);
    console.log(`       id: ${ch.id} | slug: ${ch.slug} | status: ${ch.status}`);
    console.log(`       ${wpOk} legacy_wp_id: ${ch.legacy_wp_id ?? "(null)"}  ${urlOk} legacy_url: ${ch.legacy_url ?? "(null)"}`);
}

const expectedWpIds = { 1: 198, 2: 204, 3: 211 };
let allOk = true;
for (const ch of allChapters) {
    const expected = expectedWpIds[ch.sort_order];
    if (expected !== undefined && ch.legacy_wp_id !== expected) {
        console.error(`\n✗ sort_order=${ch.sort_order}: expected legacy_wp_id=${expected}, got ${ch.legacy_wp_id}`);
        allOk = false;
    }
}
if (allOk) {
    console.log(`\n✓ All legacy_wp_id values correct (1→198, 2→204, 3→211).`);
    console.log(`✓ ${allChapters.length} chapters total — no extras created.`);
}
