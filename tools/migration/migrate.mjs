/**
 * WordPress → Transmagia migration tool.
 *
 * Usage:
 *   npm run migration:wp -- --dry-run books.csv
 *   npm run migration:wp -- --import books.csv      (architecture ready, not yet active)
 *
 * books.csv format (UTF-8):
 *   title,url,section
 *   Шум дождя,https://transmagia.house/шум-дождя/,originals
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fetchWordPressPage, extractChapterLinks, parseChapterHtml, normalizeUrl } from "./lib/parser.mjs";
import { slugify, findUniqueSuffix } from "./lib/slug.mjs";
import {
    createSupabaseClient,
    findSectionBySlug,
    findBookByLegacyUrl,
    findBookByWpId,
    findBookBySectionAndSlug,
    findChapterByLegacyUrl,
    findChapterByWpId,
    insertBook,
    insertChapter,
    uploadChapterImage,
} from "./lib/importer.mjs";

// ── CLI argument parsing ─────────────────────────────────────────────────────

function parseArgs(argv) {
    const args = argv.slice(2);
    const mode = args.includes("--import") ? "import" : args.includes("--dry-run") ? "dry-run" : null;
    const csvFile = args.find((a) => !a.startsWith("--"));
    return { mode, csvFile };
}

function parseCsv(content) {
    const lines = content.trim().split("\n").filter((l) => l.trim());
    if (lines.length === 0) return [];
    const firstLower = lines[0].toLowerCase();
    const startIndex = firstLower.startsWith("title") ? 1 : 0;
    return lines.slice(startIndex).map((line) => {
        const parts = [];
        let current = "";
        let inQuotes = false;
        for (const ch of line) {
            if (ch === '"') { inQuotes = !inQuotes; }
            else if (ch === "," && !inQuotes) { parts.push(current.trim()); current = ""; }
            else { current += ch; }
        }
        parts.push(current.trim());
        const [title = "", url = "", section = ""] = parts;
        return { title: title.trim(), url: url.trim(), section: section.trim() };
    }).filter((r) => r.title && r.url);
}

// ── Normalisation ────────────────────────────────────────────────────────────

function normalizeChapterSlug(title, usedSlugsByBook) {
    const base = slugify(title);
    const slug = findUniqueSuffix(base, usedSlugsByBook);
    usedSlugsByBook.add(slug);
    return slug;
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateMigrationData(books) {
    const allChapterUrls = new Map(); // url → book title
    const allWpIds = new Map();       // wpId → chapter title
    const errors = [];
    const warnings = [];

    for (const book of books) {
        for (const ch of book.chapters) {
            if (ch.legacyUrl) {
                if (allChapterUrls.has(ch.legacyUrl)) {
                    errors.push(
                        `Cross-book duplicate chapter URL: ${ch.legacyUrl}\n  → "${allChapterUrls.get(ch.legacyUrl)}" and "${book.title}"`
                    );
                } else {
                    allChapterUrls.set(ch.legacyUrl, book.title);
                }
            }
            if (ch.legacyWpId != null) {
                if (allWpIds.has(ch.legacyWpId)) {
                    warnings.push(
                        `Duplicate legacy_wp_id ${ch.legacyWpId}: "${allWpIds.get(ch.legacyWpId)}" and "${ch.title}" in "${book.title}"`
                    );
                } else {
                    allWpIds.set(ch.legacyWpId, ch.title);
                }
            }
        }
    }
    return { errors, warnings };
}

// ── Core pipeline ─────────────────────────────────────────────────────────────

async function processBook(csvRow, existingCheck) {
    const result = {
        title: csvRow.title,
        slug: "",
        section: csvRow.section,
        legacyUrl: csvRow.url,
        legacyWpId: null,
        chapters: [],
        warnings: [],
        errors: [],
        bookPageOk: false,
        alreadyImported: null,
    };

    // Fetch book page first — WP page ID (needed for identity check) is only in the HTML.
    let bookHtml;
    try {
        const { ok, status, html } = await fetchWordPressPage(csvRow.url);
        if (!ok) {
            result.errors.push(`Book page unreachable: HTTP ${status}`);
            return result;
        }
        bookHtml = html;
        result.bookPageOk = true;
    } catch (err) {
        result.errors.push(`Book page fetch error: ${err instanceof Error ? err.message : String(err)}`);
        return result;
    }

    // Extract WordPress page ID from body class (page-id-NNN for Pages, postid-NNN for Posts).
    const bodyClassMatch = bookHtml.match(/<body[^>]*class="([^"]*)"/i);
    const bodyClass = bodyClassMatch ? bodyClassMatch[1] : "";
    const wpIdMatch = bodyClass.match(/(?:page-id|postid)-(\d+)/);
    result.legacyWpId = wpIdMatch ? Number(wpIdMatch[1]) : null;

    // Book identity check — 3 tiers:
    //   1. WP page ID (most reliable; survives URL slug changes)
    //   2. Normalized legacy_url (secondary)
    //   3. Section + generated slug (conflict guard — never auto-insert with suffix)
    if (existingCheck) {
        let existing = null;
        if (result.legacyWpId != null) {
            existing = await existingCheck.findBookByWpId(result.legacyWpId);
        }
        if (!existing) {
            existing = await existingCheck.findBook(normalizeUrl(csvRow.url));
        }
        if (existing) {
            result.alreadyImported = existing;
        } else {
            const bookSlug = slugify(csvRow.title);
            const conflict = await existingCheck.findBookConflict(csvRow.section, bookSlug);
            if (conflict) {
                result.errors.push(
                    `Book slug conflict: "${bookSlug}" already exists in section "${csvRow.section}" ` +
                    `(id: ${conflict.id}) but has no matching legacy identity (legacy_url/legacy_wp_id are null). ` +
                    `Attach the legacy identity fields to this book first, then retry.`
                );
            }
        }
    }

    // Extract chapter links
    const links = extractChapterLinks(bookHtml, csvRow.url);
    if (links.length === 0) {
        result.warnings.push("No chapter links found on book page");
    }

    // Deduplicate within book
    const seenInBook = new Set();
    const usedSlugs = new Set();
    let sortOrder = 0;

    for (const link of links) {
        if (seenInBook.has(link.href)) {
            result.warnings.push(`Duplicate chapter link within book: ${link.href}`);
            continue;
        }
        seenInBook.add(link.href);
        sortOrder++;

        const chapterResult = {
            sortOrder,
            title: link.text,
            slug: normalizeChapterSlug(link.text, usedSlugs),
            legacyUrl: link.href,
            legacyWpId: null,
            rawHtml: null,
            cleanedHtml: null,
            content: null,
            images: [],
            nodeCount: {},
            warnings: [],
            errors: [],
            status: "pending",
            alreadyImported: null,
        };

        // Check if already imported
        if (existingCheck) {
            const existing = await existingCheck.findChapter(link.href);
            if (existing) {
                chapterResult.alreadyImported = existing;
                chapterResult.status = "already_imported";
                result.chapters.push(chapterResult);
                continue;
            }
        }

        // Fetch chapter page
        let chapterHtml;
        try {
            const { ok, status, html } = await fetchWordPressPage(link.href);
            if (!ok) {
                chapterResult.errors.push(`HTTP ${status}`);
                chapterResult.status = "error";
                result.chapters.push(chapterResult);
                continue;
            }
            chapterHtml = html;
        } catch (err) {
            chapterResult.errors.push(`Fetch error: ${err instanceof Error ? err.message : String(err)}`);
            chapterResult.status = "error";
            result.chapters.push(chapterResult);
            continue;
        }

        // Parse chapter
        const parsed = parseChapterHtml(chapterHtml);
        if (!parsed.ok) {
            chapterResult.errors.push(parsed.error ?? "Parse failed");
            chapterResult.status = "error";
            chapterResult.rawHtml = parsed.rawHtml ?? null;
            chapterResult.cleanedHtml = parsed.cleanedHtml ?? null;
            result.chapters.push(chapterResult);
            continue;
        }

        chapterResult.legacyWpId = parsed.sourcePostId ?? null;
        chapterResult.rawHtml = parsed.rawHtml;
        chapterResult.cleanedHtml = parsed.cleanedHtml;
        chapterResult.content = parsed.content;
        chapterResult.images = parsed.images;
        chapterResult.nodeCount = parsed.nodeCount;

        // Use extracted title if it's more complete than the link text
        if (parsed.extractedTitle && parsed.extractedTitle.length > chapterResult.title.length) {
            chapterResult.title = parsed.extractedTitle;
            chapterResult.slug = normalizeChapterSlug(parsed.extractedTitle, usedSlugs);
        }

        // Secondary duplicate check: WP post ID is the primary identity key.
        // The URL check above is an early optimistic skip; this catches chapters
        // whose WordPress slug was truncated or changed but whose post is the same.
        if (existingCheck && chapterResult.legacyWpId != null) {
            const existingByWpId = await existingCheck.findChapterByWpId(chapterResult.legacyWpId);
            if (existingByWpId) {
                chapterResult.alreadyImported = existingByWpId;
                chapterResult.status = "already_imported";
                result.chapters.push(chapterResult);
                continue;
            }
        }

        // Validate content
        const textNodes = chapterResult.nodeCount["text"] ?? 0;
        if (textNodes === 0) {
            chapterResult.warnings.push("Chapter content appears empty (no text nodes)");
        }

        for (const img of chapterResult.images) {
            // In dry-run we just note the image; actual reachability check is deferred
            if (!img.startsWith("http")) {
                chapterResult.warnings.push(`Relative image URL may not resolve: ${img}`);
            }
        }

        chapterResult.status = chapterResult.warnings.length > 0 ? "warning" : "ok";
        result.chapters.push(chapterResult);
    }

    return result;
}

// ── Report ───────────────────────────────────────────────────────────────────

function formatReport(books, crossValidation, mode) {
    const lines = [];
    const SEP = "─".repeat(60);

    lines.push("═".repeat(60));
    lines.push("  WordPress Migration Dry-Run");
    lines.push(`  Mode: ${mode.toUpperCase()}`);
    lines.push("═".repeat(60));
    lines.push("");

    let totalChapters = 0;
    let totalOk = 0;
    let totalWarning = 0;
    let totalError = 0;
    let totalAlreadyImported = 0;
    let totalImages = 0;

    for (let bi = 0; bi < books.length; bi++) {
        const book = books[bi];
        lines.push(SEP);
        lines.push(`BOOK ${bi + 1}/${books.length}: ${book.title}`);
        lines.push(`  New slug:    ${book.slug || slugify(book.title)}`);
        lines.push(`  Section:     ${book.section}`);
        lines.push(`  Source URL:  ${book.legacyUrl}`);
        if (book.legacyWpId != null) lines.push(`  WP page ID:  ${book.legacyWpId}`);
        lines.push(`  Book page:   ${book.bookPageOk ? "✓ reachable" : "✗ unreachable"}`);

        if (book.alreadyImported) {
            lines.push(`  ↩ Existing migration target: id=${book.alreadyImported.id} slug=${book.alreadyImported.slug}`);
        }

        lines.push(`  Chapters found: ${book.chapters.length}`);
        lines.push("");

        for (const ch of book.chapters) {
            totalChapters++;
            if (ch.status === "already_imported") totalAlreadyImported++;
            else if (ch.status === "ok") totalOk++;
            else if (ch.status === "warning") totalWarning++;
            else if (ch.status === "error") totalError++;
            totalImages += ch.images?.length ?? 0;

            const icon = ch.status === "ok" ? "✓" : ch.status === "warning" ? "⚠" : ch.status === "already_imported" ? "↩" : "✗";
            lines.push(`  [${icon}] ${ch.sortOrder.toString().padStart(2)}. ${ch.title}`);
            lines.push(`       Slug:       ${ch.slug}`);
            lines.push(`       Legacy URL: ${ch.legacyUrl}`);
            if (ch.legacyWpId != null) lines.push(`       WP post ID: ${ch.legacyWpId}`);
            if (ch.alreadyImported) lines.push(`       Imported:   ↩ already exists (id: ${ch.alreadyImported.id})`);
            if (ch.rawHtml != null) {
                lines.push(`       Raw HTML:   ${Buffer.byteLength(ch.rawHtml, "utf8")} bytes`);
                lines.push(`       Clean HTML: ${Buffer.byteLength(ch.cleanedHtml ?? "", "utf8")} bytes`);
            }
            if (Object.keys(ch.nodeCount ?? {}).length > 0) {
                const nodeStr = Object.entries(ch.nodeCount).map(([k, v]) => `${k}:${v}`).join(" ");
                lines.push(`       Tiptap:     ${nodeStr}`);
            }
            if (ch.images?.length) lines.push(`       Images:     ${ch.images.length}`);
            for (const w of ch.warnings) lines.push(`       ⚠ ${w}`);
            for (const e of ch.errors) lines.push(`       ✗ ${e}`);
            lines.push("");
        }

        if (book.warnings.length > 0) {
            lines.push("  Book warnings:");
            for (const w of book.warnings) lines.push(`    ⚠ ${w}`);
            lines.push("");
        }
        if (book.errors.length > 0) {
            lines.push("  Book errors:");
            for (const e of book.errors) lines.push(`    ✗ ${e}`);
            lines.push("");
        }
    }

    lines.push("═".repeat(60));
    lines.push("SUMMARY");
    lines.push(`  Books:            ${books.length}`);
    lines.push(`  Chapters total:   ${totalChapters}`);
    lines.push(`  ✓ Parsed OK:      ${totalOk}`);
    lines.push(`  ⚠ With warnings:  ${totalWarning}`);
    lines.push(`  ✗ Errors:         ${totalError}`);
    lines.push(`  ↩ Already imported: ${totalAlreadyImported} (will skip on real import)`);
    lines.push(`  Images discovered: ${totalImages}`);

    if (crossValidation.errors.length > 0) {
        lines.push("");
        lines.push("  Cross-book errors:");
        for (const e of crossValidation.errors) lines.push(`    ✗ ${e}`);
    }
    if (crossValidation.warnings.length > 0) {
        lines.push("");
        lines.push("  Cross-book warnings:");
        for (const w of crossValidation.warnings) lines.push(`    ⚠ ${w}`);
    }

    lines.push("");
    if (mode === "dry-run") {
        lines.push("Dry-run complete. No writes performed.");
    }
    lines.push("═".repeat(60));

    return lines.join("\n");
}

// ── Import mode (architecture prepared, not yet active) ──────────────────────

async function runImport(books, supabase) {
    const usedBookSlugs = new Set();

    for (const book of books) {
        const section = await findSectionBySlug(supabase, book.section.toLowerCase());
        if (!section) {
            console.error(`✗ Section not found: "${book.section}" — skipping book "${book.title}"`);
            continue;
        }

        // 3-tier book identity check (mirrors processBook logic — belt and suspenders)
        let bookRecord = null;
        if (book.legacyWpId != null) {
            bookRecord = await findBookByWpId(supabase, book.legacyWpId);
        }
        if (!bookRecord) {
            bookRecord = await findBookByLegacyUrl(supabase, normalizeUrl(book.legacyUrl));
        }
        if (bookRecord) {
            console.log(`↩ Book already exists: "${book.title}" (${bookRecord.id})`);
        } else {
            // Guard against slug collision without legacy identity — never create slug-2
            const existingBySlug = await findBookBySectionAndSlug(supabase, section.id, book.slug);
            if (existingBySlug) {
                console.error(
                    `✗ Book slug conflict: "${book.slug}" in section "${book.section}" ` +
                    `(id: ${existingBySlug.id}) has no legacy identity — skipping book and its chapters`
                );
                continue;
            }
            const bookSlug = findUniqueSuffix(slugify(book.title), usedBookSlugs);
            usedBookSlugs.add(bookSlug);
            bookRecord = await insertBook(supabase, {
                sectionId: section.id,
                title: book.title,
                slug: bookSlug,
                legacyUrl: normalizeUrl(book.legacyUrl),
                legacyWpId: book.legacyWpId ?? null,
            });
            console.log(`✓ Book created: "${book.title}" (${bookRecord.id})`);
        }

        for (const ch of book.chapters) {
            if (ch.status === "already_imported" || ch.status === "error") continue;

            // WP ID is primary; URL is fallback. Guards against double-insert
            // if a chapter slips through dry-run duplicate detection.
            const existing =
                ch.legacyWpId != null
                    ? (await findChapterByWpId(supabase, ch.legacyWpId)) ??
                      (await findChapterByLegacyUrl(supabase, ch.legacyUrl))
                    : await findChapterByLegacyUrl(supabase, ch.legacyUrl);
            if (existing) {
                console.log(`  ↩ Chapter already imported: "${ch.title}"`);
                continue;
            }

            if (!ch.content) {
                console.error(`  ✗ Skipping chapter with no content: "${ch.title}"`);
                continue;
            }

            // Upload images and rewrite src paths in content
            // (images tracked separately; content object already uses Tiptap structure)
            // For now, image src in content reflects the WP URL — rewriting requires
            // re-processing the cleaned HTML with uploaded paths, handled here in real import.
            const uploadedImages = [];
            for (const imgUrl of ch.images) {
                try {
                    const result = await uploadChapterImage(supabase, imgUrl, ch.legacyUrl, bookRecord.id);
                    uploadedImages.push(result);
                } catch (err) {
                    console.warn(`  ⚠ Image upload failed for "${imgUrl}": ${err instanceof Error ? err.message : String(err)}`);
                }
            }

            const inserted = await insertChapter(supabase, {
                bookId: bookRecord.id,
                title: ch.title,
                slug: ch.slug,
                content: ch.content,
                sortOrder: ch.sortOrder,
                legacyWpId: ch.legacyWpId,
                legacyUrl: ch.legacyUrl,
            });
            console.log(`  ✓ Chapter inserted: "${inserted.title}" (${inserted.id})`);
        }
    }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const { mode, csvFile } = parseArgs(process.argv);

    if (!mode) {
        console.error("Usage: migrate.mjs --dry-run books.csv  OR  --import books.csv");
        process.exitCode = 1;
        return;
    }

    if (!csvFile) {
        console.error("Error: No CSV file specified.");
        process.exitCode = 1;
        return;
    }

    const csvPath = resolve(process.cwd(), csvFile);
    let csvContent;
    try {
        csvContent = readFileSync(csvPath, "utf8");
    } catch (err) {
        console.error(`Error reading CSV: ${err instanceof Error ? err.message : String(err)}`);
        process.exitCode = 1;
        return;
    }

    const rows = parseCsv(csvContent);
    if (rows.length === 0) {
        console.error("Error: CSV contains no valid book rows.");
        process.exitCode = 1;
        return;
    }

    console.log(`Processing ${rows.length} book(s) from ${csvFile} [${mode}]...\n`);

    // For dry-run, still check existing records so we can report them
    let existingCheck = null;
    if (mode === "dry-run" || mode === "import") {
        try {
            const supabase = createSupabaseClient();
            existingCheck = {
                findBook: (url) => findBookByLegacyUrl(supabase, url),
                findBookByWpId: (wpId) => findBookByWpId(supabase, wpId),
                findBookConflict: async (sectionSlug, bookSlug) => {
                    const sec = await findSectionBySlug(supabase, sectionSlug.toLowerCase());
                    if (!sec) return null;
                    return await findBookBySectionAndSlug(supabase, sec.id, bookSlug);
                },
                findChapter: (url) => findChapterByLegacyUrl(supabase, url),
                findChapterByWpId: (wpId) => findChapterByWpId(supabase, wpId),
                supabase,
            };
        } catch (err) {
            if (mode === "import") {
                console.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
                process.exitCode = 1;
                return;
            }
            // dry-run can proceed without Supabase, just without duplicate detection
            console.warn(`Warning: Supabase unavailable — skipping duplicate detection.\n  ${err instanceof Error ? err.message : String(err)}\n`);
        }
    }

    // Compute book slugs upfront to detect duplicates
    const usedBookSlugs = new Set();
    const books = [];

    for (const row of rows) {
        const book = await processBook(row, existingCheck);
        book.slug = findUniqueSuffix(slugify(row.title), usedBookSlugs);
        usedBookSlugs.add(book.slug);
        books.push(book);
    }

    const crossValidation = validateMigrationData(books);

    console.log(formatReport(books, crossValidation, mode));

    if (mode === "import") {
        if (crossValidation.errors.length > 0) {
            console.error("\nAborted: cross-book validation errors must be resolved before import.");
            process.exitCode = 1;
            return;
        }
        const fatalBookErrors = books.some((b) => b.errors.length > 0);
        if (fatalBookErrors) {
            console.error("\nAborted: book-level errors must be resolved before import.");
            process.exitCode = 1;
            return;
        }
        console.log("\nStarting import...\n");
        await runImport(books, existingCheck.supabase);
        console.log("\nImport complete.");
    }
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
});
