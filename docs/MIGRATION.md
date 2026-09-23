# Transmagia — WordPress Migration Plan

## 1. Source Structure

The current WordPress site has an important structural characteristic:

- a **book is a WordPress Page**;
- chapters are separate WordPress Posts;
- the book Page contains hyperlinks to its chapter Posts;
- chapter URLs do not reliably reveal the parent book;
- WordPress categories/tags/taxonomies are not available as the book/chapter relationship.

Therefore, the relationship must be derived from the links present on each book Page.

## 2. Manual Input — `books.csv`

The administrator prepares an authoritative UTF-8 CSV file:

```text
title,url,section
```

Example (`tools/migration/books.csv`):

```csv
title,url,section
Шум дождя,https://transmagia.house/шум-дождя/,originals
```

Columns:

| Column | Description |
|---|---|
| `title` | Book title used for slug generation — authoritative |
| `url` | WordPress book page URL (`legacy_url`) |
| `section` | Target Transmagia section slug (must already exist in DB) |

**Do not auto-discover books.** This is an intentionally small manual step.

## 3. Slug Generation

All new Transmagia slugs are generated from titles using `slugify()` from `lib/slug.ts` (mirrored as `tools/migration/lib/slug.mjs`).

**Rule:** `slugify(title)` → stable ASCII slug via Cyrillic transliteration.

```text
title:       Шум дождя
new slug:    shum-dozhdya

title:       1. Жизнь — худшая из проявлений реальности
new slug:    1-zhizn-khudshaya-iz-proyavleniy-realnosti
```

**Never** derive a Transmagia slug from a WordPress URL. The WordPress URL is preserved only as `legacy_url`.

**Collision strategy:** suffix `-2`, `-3`, … appended until free within the same scope (books: `(section_id, slug)`, chapters: `(book_id, slug)`).

## 4. Legacy Traceability

Every imported record stores:

| Field | Description |
|---|---|
| `legacy_url` | Original WordPress URL — used for duplicate detection and redirect mapping |
| `legacy_wp_id` | WordPress numeric post ID (extracted from `postid-NNN` body class) |

These fields allow source tracing and prevent re-import of already-migrated content.

## 5. Tool Structure

```
tools/
  migration-test/
    import-wordpress-chapter.mjs   original one-off test (preserved)
    README.md
  migration/
    migrate.mjs                    CLI entry point
    books.csv                      input file (edit before running)
    lib/
      parser.mjs                   HTML fetching, WordPress cleaning, Tiptap conversion
      slug.mjs                     slugify mirror of lib/slug.ts
      importer.mjs                 Supabase client + DB/storage operations
    tests/
      fixtures.mjs                 HTML test fixtures (no live network access)
      parser.test.mjs              parser unit tests
      slug.test.mjs                slug unit tests
```

## 6. Commands

### Dry-run

```bash
npm run migration:wp -- --dry-run tools/migration/books.csv
```

Dry-run:
- fetches WordPress pages;
- extracts chapter links from book pages;
- fetches and parses every chapter page;
- generates normalized migration data;
- checks for existing imported records (`legacy_url` match);
- prints a human-readable report.

Dry-run **does NOT**:
- insert books or chapters;
- update existing records;
- upload images;
- modify Supabase Storage.

### Real import (architecture prepared — not yet active for mass import)

```bash
npm run migration:wp -- --import tools/migration/books.csv
```

Real import requires `--import` to be explicit. It will abort if cross-book validation errors exist.

## 7. Automated Process

For each book in the CSV:

1. Fetch the WordPress book page;
2. Extract chapter links from the content area (`.post-content` / `.entry-content` inside `article`);
3. Deduplicate chapter links, preserve document order for `sort_order`;
4. For each chapter link: fetch the chapter page, extract `article > .post-content`;
5. Capture `rawHtml` (before cleaning) and `cleanedHtml` (after cleaning) separately;
6. Remove WordPress navigation/ads/comments elements;
7. Convert cleaned HTML to Tiptap JSON (`generateJSON` from `@tiptap/core`);
8. Assign new slug from chapter title via `slugify()`;
9. Check `legacy_url` against existing DB records — skip if already imported;
10. In real import: upload images to `content-images` storage, rewrite `src` paths.

## 8. HTML Cleaning Rules

The cleaner (preserved from the proven Phase 5 one-off tool) removes:

- `script`, `style`, `nav`, `form`
- `.sharedaddy`, `.jp-relatedposts`, `.comments-area`, `.comment-respond`
- `.post-navigation`, `.previous`, `.next`, `.post-categories`, `.post-meta`
- `.wp-block-spacer`, `[class*='share']`, `[class*='social']`
- `[class*='advert']`, `[class*='widget']`
- Attributes: `id`, `style`, `onclick`, `class`, `data-id`, `data-block`, `aria-label`

## 9. Intermediate Representation

```json
{
  "title": "Шум дождя",
  "slug": "shum-dozhdya",
  "section": "originals",
  "legacyUrl": "https://transmagia.house/шум-дождя/",
  "chapters": [
    {
      "sortOrder": 1,
      "title": "1. Жизнь — худшая из проявлений реальности",
      "slug": "1-zhizn-khudshaya-iz-proyavleniy-realnosti",
      "legacyUrl": "https://transmagia.house/1-zhizn.../",
      "legacyWpId": 12345,
      "rawHtml": "...",
      "cleanedHtml": "...",
      "content": { "type": "doc", "content": [...] },
      "images": ["https://transmagia.house/wp-content/..."],
      "status": "ok | warning | error | already_imported"
    }
  ]
}
```

## 10. Validation

The tool detects and reports:

- Book page unreachable (error)
- No chapter links found on book page (warning)
- Chapter page unreachable (error per chapter)
- Content container not found (error per chapter)
- Empty chapter content — no text nodes (warning)
- Tiptap conversion failure (error)
- Duplicate chapter URL within a book (warning)
- Duplicate chapter URL across books (error)
- Duplicate `legacy_wp_id` across all chapters (warning)
- Relative image URLs that may not resolve (warning)
- Already-imported records detected by `legacy_url` (informational — will skip on import)

## 11. Duplicate Detection

The tool checks `legacy_url` against existing DB records before (and after) import:

- `books.legacy_url` — book already imported
- `chapters.legacy_url` — chapter already imported

This protects the existing `Шум дождя` test chapter imported during Phase 5. It is detected as "already imported" and skipped — never overwritten.

## 12. Image Migration

Content images in WordPress posts are migrated to the private `content-images` Supabase Storage bucket.

Storage path format: `{bookId}/chapters/{uuid}.{ext}`

The application serves these via the authorized `/api/content-images/[...path]` endpoint, which validates access before signing a temporary URL.

**In dry-run:** image URLs are identified and reported but not downloaded or uploaded.

**In real import:** images are uploaded, and `src` attributes in the content are rewritten to `/api/content-images/{path}`.

Do not make `content-images` public.

## 13. Chapter Ordering

Chapter link order on the WordPress book page becomes `chapters.sort_order`.

## 14. Migration Safety

Do not run a mass import until:

1. Dry-run completes with zero errors;
2. Per-chapter content is visually verified for representative chapters;
3. Image migration is verified for a sample book;
4. Counts match WordPress source counts.

Keep the old WordPress site operational while validation proceeds.

## 15. WordPress Access Method

The migration tool uses direct HTTP fetching of public WordPress pages (no API key required). The same method used and proven in the Phase 5 one-off test.
