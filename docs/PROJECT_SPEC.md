# Transmagia — Project Specification

## 1. Project Goal

Transmagia is being rebuilt from the existing WordPress website `transmagia.house` as a custom publishing web application for long-form fiction: original novels, fanfiction, translations, and similar content.

Primary goals:

- make publishing and editing books and chapters simple;
- provide a comfortable long-form reading experience;
- support public, registered-user, and password-protected access;
- support comments from registered readers;
- provide a lightweight admin CMS;
- migrate the existing WordPress archive with minimal manual work.

The project is a purpose-built publishing system, not a generic WordPress replacement.

## 2. Stack

- Next.js
- TypeScript
- Supabase: PostgreSQL, Auth, Storage, Row Level Security (RLS)
- Tiptap OSS/MIT for WYSIWYG editing
- shadcn/ui + Tailwind CSS + Lucide Icons

Use only Tiptap OSS/MIT functionality. Do not introduce Tiptap Cloud/Platform, Pro, AI, collaboration, or other paid dependencies without explicit approval.

## 3. Core Content Hierarchy

```text
Section
  └── Book
       └── Chapter
            └── Comments
```

Initial content sections:

- Original Novels (`originals`)
- Fanfiction (`fanfiction`)
- Translations (`translations`)

## 4. Site Pages

Public pages:

- `/` — About / Home
- `/originals` — public catalog; book content is protected
- `/fanfiction` — public catalog; book content is protected
- `/translations` — public catalog; book content is protected
- `/rules` — public site rules
- `/contacts` — public contact page

The site and admin UI are Russian-only in v1. Full i18n is not required.

## 5. Access Model

### Admin

```text
isAdmin = true
isRegistered = implicitly true
```

Admins can:

- read all content;
- access admin UI;
- create/edit/delete books and chapters;
- publish/unpublish chapters;
- reorder chapters;
- moderate/delete comments;
- register readers;
- grant/revoke admin privileges.

### Registered Reader

```text
isRegistered = true
isAdmin = false
```

Registered readers:

- authenticate with email + password;
- read all sections and books without section passwords;
- leave comments;
- cannot access the admin area.

### Anonymous Guest With Section Access

```text
no authenticated account
```

An anonymous visitor may enter a section password and receive temporary access to that specific protected section. The guest cannot comment or access admin functionality.

### Simple Visitor

Unauthenticated visitor with no temporary section access. Can read only public content and public catalogs.

## 6. Protected Content Model

The catalog pages for Original Novels, Fanfiction, and Translations are public. Book metadata may therefore be visible publicly while book/chapter content remains protected.

A section password protects reading of books/chapters within that section.

Registered users and admins bypass section-password entry.

Anonymous section access must be represented by a secure server-verified temporary mechanism, preferably a signed HTTP-only cookie. Never store plaintext section passwords.

## 7. Comments

Comments belong to chapters.

Only authenticated registered users can comment. Admins can moderate/delete comments.

## 8. Reader / PWA

Transmagia must be a Progressive Web App with a reader-first mobile experience.

Initial PWA scope:

- valid web app manifest;
- installable behavior where supported;
- app icons and metadata;
- standalone mode;
- responsive mobile reader;
- sensible caching of static application assets;
- no automatic global caching of protected chapter content.

The v1 reader must support:

- adjustable font size;
- adjustable line height;
- light/dark/system themes;
- local persistence of reader preferences;
- previous/next chapter navigation;
- return-to-book navigation;
- mobile-safe spacing and touch targets;
- accessibility-friendly typography and controls.

Do not implement a full offline library in v1.

## 9. Admin Responsive Strategy

Desktop is the primary authoring environment. Tablet support must be designed from the beginning and should support real content-management work. Full phone authoring is not a priority.

Reader responsive priority:

```text
Phone → Tablet → Desktop
```

Admin responsive priority:

```text
Desktop → Tablet → Phone
```

The phone admin UI should degrade gracefully but does not need a polished long-form authoring workflow.

## 10. Main Admin Workflow

```text
Create book
→ Add chapter
→ Write/paste content in Tiptap
→ Preview
→ Publish
→ Later add another chapter
```

Preview should use the same rendering system as the reader where practical.

## 11. Security Principle

Authorization is always enforced server-side.

Frontend visibility is not a security boundary.

Protected content must not be fetched and then merely hidden in React.

Authenticated user access should use Supabase Auth plus application role checks and RLS/server-side authorization. Anonymous protected-section access is handled separately by trusted Next.js server code validating the temporary section-access token/cookie.
