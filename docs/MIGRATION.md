# Transmagia — WordPress Migration Plan

## 1. Source Structure

The current WordPress site has an important structural characteristic:

- a **book is a WordPress Page**;
- chapters are separate WordPress Posts;
- the book Page contains hyperlinks to its chapter Posts;
- chapter URLs do not reliably reveal the parent book;
- WordPress categories/tags/taxonomies are not available as the book/chapter relationship.

Therefore, the relationship must be derived from the links present on each book Page.

## 2. Manual Input

For reliability, the administrator should manually prepare the authoritative list of book URLs.

Recommended input columns:

```text
title,url,section
```

Example:

```csv
Book A,https://transmagia.house/...,Originals
Book B,https://transmagia.house/...,Fanfiction
Book C,https://transmagia.house/...,Translations
```

This is intentionally a small manual step. The subsequent content extraction should be automated.

## 3. Automated Process

For each manually supplied book URL:

1. fetch the WordPress book Page;
2. parse the Page content;
3. extract chapter links in document order;
4. resolve each chapter link to the corresponding WordPress Post;
5. retrieve chapter title and content;
6. normalize/clean WordPress HTML;
7. convert the content to the new Tiptap-compatible representation;
8. migrate referenced media where applicable;
9. assign the manually supplied section;
10. create book and chapter records in the intermediate migration output.

The importer must not infer a chapter's parent book from the chapter URL.

## 4. Chapter Ordering

The chapter link order on the WordPress book Page is the default source for `chapters.sort_order`.

Example:

```text
/prologue/
/chapter-1/
/chapter-2/
```

becomes:

```text
Prologue    order 1
Chapter 1   order 2
Chapter 2   order 3
```

## 5. Intermediate Representation

Do not import directly from scraped HTML into production tables without validation.

Preferred pipeline:

```text
WordPress
  ↓
raw source data
  ↓
parser
  ↓
normalized migration data
  ↓
validation/report
  ↓
Supabase import
```

Conceptual JSON:

```json
{
  "title": "Example Book",
  "section": "Originals",
  "legacyUrl": "https://transmagia.house/example-book/",
  "chapters": [
    {
      "title": "Prologue",
      "legacyUrl": "https://transmagia.house/prologue/",
      "order": 1
    }
  ]
}
```

## 6. Validation Report

The migration tool should produce both aggregate and per-book diagnostics.

Example:

```text
Books processed: 48
Chapters found: 1284
Chapters successfully parsed: 1281
Warnings: 3
Errors: 0
```

Detect at least:

- broken chapter links;
- duplicate chapter links;
- a chapter linked from multiple books;
- posts that cannot be retrieved;
- empty chapter content;
- unexpected HTML structures;
- media that cannot be migrated;
- duplicate book slugs.

Do not perform the final import until material warnings/errors are reviewed.

## 7. Legacy Traceability

Preserve:

- `legacy_wp_id`;
- `legacy_url`.

These allow source tracing and redirect mapping.

## 8. Media Migration

Book covers and in-content images should be copied into Supabase Storage where practical.

The importer should rewrite references in imported content to point to the new storage paths/URLs.

## 9. Redirects

After migration, map legacy WordPress URLs to their new equivalents where possible.

This protects existing bookmarks and external links.

## 10. Migration Safety

Keep the old WordPress site operational while the new system is validated.

Recommended approach:

1. migrate one representative book;
2. compare content visually and structurally;
3. fix parser/conversion issues;
4. run a full migration into a safe environment;
5. validate counts and anomalies;
6. import production data;
7. switch the domain after verification.

## 11. WordPress Access Method

The migration tool may use the WordPress REST API, an export/WXR file, or another reliable read-only source available from the site. The implementation should choose the most stable source after testing the live WordPress installation.
