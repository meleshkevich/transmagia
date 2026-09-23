/**
 * One-off script: set legacy_url on the Phase 5 test chapter.
 *
 * Usage (inspect only — no writes):
 *   node --env-file=.env.local tools/migration/register-phase5-chapter.mjs
 *
 * Usage (apply):
 *   node --env-file=.env.local tools/migration/register-phase5-chapter.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";

const CHAPTER_TITLE = "1. Жизнь — худшая из проявлений реальности";
const BOOK_TITLE = "Шум дождя";
// WordPress canonical slug: the actual URL used on the book page ToC (218 chars).
// The Phase 5 tool used a longer non-canonical variant (реальности); WordPress
// stored and links to this shorter truncation (реальнос). The tool extracts this
// URL from the book page, so the DB must match it for duplicate detection to work.
const LEGACY_URL =
    "https://transmagia.house/1-%D0%B6%D0%B8%D0%B7%D0%BD%D1%8C-%D1%85%D1%83%D0%B4%D1%88%D0%B0%D1%8F-%D0%B8%D0%B7-%D0%BF%D1%80%D0%BE%D1%8F%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B9-%D1%80%D0%B5%D0%B0%D0%BB%D1%8C%D0%BD%D0%BE%D1%81/";

const apply = process.argv.includes("--apply");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error("Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
    process.exitCode = 1;
    process.exit();
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Find book
const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("id, title, slug")
    .eq("title", BOOK_TITLE)
    .maybeSingle();
if (bookErr) throw bookErr;
if (!book) {
    console.error(`Book not found: "${BOOK_TITLE}"`);
    process.exitCode = 1;
    process.exit();
}
console.log(`Book found: "${book.title}" (id: ${book.id}, slug: ${book.slug})`);

// Find chapter
const { data: chapter, error: chErr } = await supabase
    .from("chapters")
    .select("id, title, slug, status, sort_order, legacy_url, legacy_wp_id")
    .eq("book_id", book.id)
    .eq("title", CHAPTER_TITLE)
    .maybeSingle();
if (chErr) throw chErr;
if (!chapter) {
    console.error(`Chapter not found: "${CHAPTER_TITLE}" in book "${BOOK_TITLE}"`);
    process.exitCode = 1;
    process.exit();
}

console.log("\nExisting chapter record:");
console.log(`  id:           ${chapter.id}`);
console.log(`  title:        ${chapter.title}`);
console.log(`  slug:         ${chapter.slug}`);
console.log(`  status:       ${chapter.status}`);
console.log(`  sort_order:   ${chapter.sort_order}`);
console.log(`  legacy_wp_id: ${chapter.legacy_wp_id ?? "(null)"}`);
console.log(`  legacy_url:   ${chapter.legacy_url ?? "(null)"}`);
console.log(`\n  Target URL:   ${LEGACY_URL}`);

if (chapter.legacy_url === LEGACY_URL) {
    console.log("\n✓ legacy_url already correct. No change needed.");
    process.exit();
}

if (!apply) {
    console.log("\nDry-inspect complete. To apply the update, rerun with --apply.");
    process.exit();
}

// Apply update — only set legacy_url, touch nothing else
const { error: updateErr } = await supabase
    .from("chapters")
    .update({ legacy_url: LEGACY_URL })
    .eq("id", chapter.id);
if (updateErr) throw updateErr;

console.log("\n✓ legacy_url updated successfully. Preserved: title, slug, content, status, sort_order, legacy_wp_id.");
