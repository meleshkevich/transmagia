/**
 * One-off script: inspect and attach legacy WordPress identity to an existing CMS book.
 *
 * Usage (inspect only — no writes):
 *   node --env-file=.env.local tools/migration/register-book.mjs
 *
 * Usage (apply):
 *   node --env-file=.env.local tools/migration/register-book.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";

const BOOK_TITLE = "Шум дождя";
const BOOK_SLUG = "shum-dozhdya";
const SECTION_SLUG = "originals";
// WordPress book-page URL from books.csv (raw Cyrillic; we normalise below)
const WP_BOOK_URL_RAW = "https://transmagia.house/шум-дождя/";

function normalizeUrl(url) {
    try {
        const u = new URL(url);
        if (!u.pathname.endsWith("/")) u.pathname += "/";
        return u.toString().replace(/%[0-9a-f]{2}/gi, m => m.toUpperCase());
    } catch {
        return url;
    }
}

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

// ── 1. Fetch WP book page to get canonical URL and page ID ────────────────────

const WP_BOOK_URL = normalizeUrl(WP_BOOK_URL_RAW);
console.log(`\nFetching WordPress book page: ${WP_BOOK_URL}`);

let wpPageId = null;
let canonicalUrl = WP_BOOK_URL;
try {
    const response = await fetch(WP_BOOK_URL, { redirect: "follow" });
    if (!response.ok) {
        console.warn(`  ⚠ WP page returned HTTP ${response.status} — page ID unavailable`);
    } else {
        const html = await response.text();
        // WordPress Pages use page-id-NNN in body class; Posts use postid-NNN
        const match = html.match(/<body[^>]*class="([^"]*)"/i);
        const bodyClass = match ? match[1] : "";
        const idMatch = bodyClass.match(/(?:page-id|postid)-(\d+)/);
        wpPageId = idMatch ? Number(idMatch[1]) : null;

        // Use the final URL after redirects as the canonical
        canonicalUrl = normalizeUrl(response.url);
        console.log(`  ✓ Canonical URL: ${canonicalUrl}`);
        console.log(`  ✓ WP page ID:    ${wpPageId ?? "(not found in body class)"}`);
    }
} catch (err) {
    console.warn(`  ⚠ Fetch failed: ${err.message}`);
}

// ── 2. Find section ───────────────────────────────────────────────────────────

const { data: section, error: sectionErr } = await supabase
    .from("sections")
    .select("id, slug, name")
    .eq("slug", SECTION_SLUG)
    .maybeSingle();
if (sectionErr) throw sectionErr;
if (!section) {
    console.error(`Section not found: "${SECTION_SLUG}"`);
    process.exitCode = 1;
    process.exit();
}
console.log(`\nSection: "${section.name}" (id: ${section.id})`);

// ── 3. Find book ──────────────────────────────────────────────────────────────

const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("id, title, slug, status, legacy_url, legacy_wp_id, section_id")
    .eq("section_id", section.id)
    .eq("slug", BOOK_SLUG)
    .maybeSingle();
if (bookErr) throw bookErr;
if (!book) {
    console.error(`Book not found: slug="${BOOK_SLUG}" in section "${SECTION_SLUG}"`);
    process.exitCode = 1;
    process.exit();
}
if (book.title !== BOOK_TITLE) {
    console.error(`Title mismatch: expected "${BOOK_TITLE}", found "${book.title}"`);
    process.exitCode = 1;
    process.exit();
}

// ── 4. Count existing chapters ────────────────────────────────────────────────

const { count: chapterCount, error: countErr } = await supabase
    .from("chapters")
    .select("id", { count: "exact", head: true })
    .eq("book_id", book.id);
if (countErr) throw countErr;

// ── 5. Report ─────────────────────────────────────────────────────────────────

console.log(`\nExisting book record:`);
console.log(`  id:           ${book.id}`);
console.log(`  title:        ${book.title}`);
console.log(`  slug:         ${book.slug}`);
console.log(`  status:       ${book.status}`);
console.log(`  section_id:   ${book.section_id}`);
console.log(`  legacy_wp_id: ${book.legacy_wp_id ?? "(null)"}`);
console.log(`  legacy_url:   ${book.legacy_url ?? "(null)"}`);
console.log(`  chapters:     ${chapterCount ?? 0}`);

console.log(`\nTarget values:`);
console.log(`  legacy_url:   ${canonicalUrl}`);
console.log(`  legacy_wp_id: ${wpPageId ?? "(unavailable)"}`);

// Safety: confirm only ONE book matches before any write
const { count: matchCount, error: matchErr } = await supabase
    .from("books")
    .select("id", { count: "exact", head: true })
    .eq("section_id", section.id)
    .eq("slug", BOOK_SLUG);
if (matchErr) throw matchErr;
if ((matchCount ?? 0) !== 1) {
    console.error(`\n✗ Expected exactly 1 book with slug "${BOOK_SLUG}" in section "${SECTION_SLUG}", found ${matchCount}. Aborting.`);
    process.exitCode = 1;
    process.exit();
}

const urlAlreadySet = book.legacy_url === canonicalUrl;
const wpIdAlreadySet = wpPageId != null && book.legacy_wp_id === wpPageId;

if (urlAlreadySet && (wpPageId == null || wpIdAlreadySet)) {
    console.log(`\n✓ Legacy identity already correct. No change needed.`);
    process.exit();
}

if (!apply) {
    console.log(`\nDry-inspect complete. To apply the update, rerun with --apply.`);
    process.exit();
}

// ── 6. Apply ──────────────────────────────────────────────────────────────────

const updates = {};
if (!urlAlreadySet) updates.legacy_url = canonicalUrl;
if (wpPageId != null && !wpIdAlreadySet) updates.legacy_wp_id = wpPageId;

if (Object.keys(updates).length === 0) {
    console.log(`\n✓ Nothing to update.`);
    process.exit();
}

const { error: updateErr } = await supabase
    .from("books")
    .update(updates)
    .eq("id", book.id);
if (updateErr) throw updateErr;

console.log(`\n✓ Legacy identity attached. Updated: ${Object.keys(updates).join(", ")}`);
console.log(`  Preserved: id, title, slug, status, section, ${chapterCount} chapter(s).`);
