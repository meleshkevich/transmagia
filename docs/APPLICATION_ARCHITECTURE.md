# Transmagia — Application Architecture

## 1. High-Level Structure

```text
Next.js
├── Public Reader
├── Authentication
├── Admin CMS
└── Server-side Access Layer
        │
        └── Supabase
            ├── Auth
            ├── PostgreSQL
            └── Storage
```

## 2. Public Routes

Planned routes:

```text
/
/originals
/originals/[book-slug]
/originals/[book-slug]/[chapter-slug]
/fanfiction
/fanfiction/[book-slug]
/fanfiction/[book-slug]/[chapter-slug]
/translations
/translations/[book-slug]
/translations/[book-slug]/[chapter-slug]
/rules
/contacts
/login
/register
```

Exact route names can be adjusted if implementation or SEO considerations require it.

## 3. Admin Routes

Suggested structure:

```text
/admin
/admin/books
/admin/books/new
/admin/books/[book-id]
/admin/books/[book-id]/chapters
/admin/books/[book-id]/chapters/new
/admin/books/[book-id]/chapters/[chapter-id]/edit
/admin/comments
/admin/users
/admin/sections
```

All admin routes require server-side admin authorization.

## 4. Public Reader Flow

```text
Section catalog
→ Book
→ Chapter
```

Section catalog pages are public for the current planned content sections.

Book pages show public metadata and chapter list as appropriate, but chapter content remains behind the section-access check when the section is protected.

## 5. Chapter Request Flow

Conceptually:

```text
Chapter request
→ resolve section
→ resolve book
→ resolve chapter
→ authorize access
→ fetch/render content
```

Do not fetch protected chapter content before authorization.

## 6. Rendering Strategy

Prefer Next.js Server Components for:

- home/about;
- public section catalogs;
- book pages;
- chapter pages;
- rules and contacts.

Use Client Components only where interactivity requires them, for example:

- reader settings;
- login/register forms;
- password form;
- comment form;
- Tiptap editor;
- drag-and-drop chapter ordering;
- highly interactive admin widgets.

## 7. Central Access Layer

Avoid scattering authorization rules across UI components.

Create a reusable server-side access layer with functions conceptually similar to:

```ts
getCurrentUser()
requireAdmin()
canReadSection()
canReadBook()
canReadChapter()
canComment()
```

These are conceptual names; exact module structure can be chosen during implementation.

## 8. Admin Layout

Use a dedicated `/admin` layout with shadcn/ui components.

Primary sections:

- Books
- Comments
- Users
- Sections

The admin workflow should minimize clicks for the common task of adding a new chapter.

## 9. Chapter Editor

Expected editor page structure:

```text
Chapter title
Status
Order

Tiptap toolbar
Tiptap editor

Save draft | Preview | Publish
```

The content should be stored as Tiptap JSON in PostgreSQL.

## 10. Preview

Preview should use the same reader rendering pipeline/component styles as the actual public chapter where practical.

Avoid building a separate preview implementation that can diverge from production reader output.

## 11. Chapter Navigation

Previous/next chapter is derived from the ordered published chapters within the same book.

Do not persist previous/next IDs.

At the bottom of a chapter provide:

- previous chapter link when available;
- return to book link;
- next chapter link when available.

The last chapter must not show a next-chapter link.

## 12. Comments

Comments should load as a separate section from chapter content.

Creating a comment uses a client interaction followed by server-side authorization and persistence.

## 13. Static Site Pages

`/rules` and `/contacts` are public content pages.

Their editing/storage approach can be kept simpler than the book/chapter CMS. If editable through admin, do not force them into the book model.

## 14. Russian-only UI

All visible UI text in v1 is Russian.

Avoid hard-coding user-facing text across hundreds of components where possible; keep common UI strings reasonably centralized.

A full i18n framework is not required for v1.

## 15. Responsive Strategy

Reader is mobile-first.

Admin is desktop/tablet-first.

Do not force the full desktop admin workflow into a tiny phone layout.

## 16. PWA Boundary

The service worker should focus on the app shell and static resources in v1.

Protected chapter responses must not be globally cached merely because they were requested through the PWA.

## 17. File/Module Guidance

Exact folder structure is not fixed yet. Keep major concerns separated roughly into:

```text
app/
components/
lib/
  auth/
  access/
  db/
  migration/
```

The implementation should favor clear boundaries over a large generic framework.
