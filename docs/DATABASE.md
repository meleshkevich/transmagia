# Transmagia — Database Architecture

## 1. Database

Use Supabase PostgreSQL.

Internal primary keys should use UUIDs.

The canonical authentication identity is `auth.users.id` from Supabase Auth.

## 2. `profiles`

One-to-one with `auth.users`.

Suggested columns:

```text
id               uuid PK -> auth.users.id
is_admin         boolean NOT NULL DEFAULT false
display_name     text
created_at       timestamptz NOT NULL DEFAULT now()
updated_at       timestamptz NOT NULL DEFAULT now()
```

There is intentionally no `is_registered` column. An authenticated account with a valid profile is a registered user.

Business invariant:

```text
is_admin = true => authenticated account exists => registered user
```

## 3. `sections`

Suggested columns:

```text
id                    uuid PK
name                  text NOT NULL
slug                  text UNIQUE NOT NULL
description           text
password_hash         text NULL
created_at            timestamptz NOT NULL DEFAULT now()
updated_at            timestamptz NOT NULL DEFAULT now()
```

Interpretation:

- `password_hash IS NULL` — books in the section are public to read.
- `password_hash IS NOT NULL` — catalog is public, but reading book/chapter content requires either registered access or valid anonymous section access.

Current planned sections use protected book content, but the schema should not hard-code section names.

## 4. `books`

Suggested columns:

```text
id                  uuid PK
section_id          uuid NOT NULL -> sections.id
title               text NOT NULL
slug                text NOT NULL
author              text
description         text
cover_image_path    text
status              book_status
created_at          timestamptz NOT NULL DEFAULT now()
updated_at          timestamptz NOT NULL DEFAULT now()
legacy_wp_id        bigint NULL
legacy_url          text NULL
```

Recommended constraints:

```text
UNIQUE(section_id, slug)
```

The `status` enum can initially be `draft` / `published`, but the exact semantics should be finalized during implementation. Chapter publication is the primary control over reader-visible text.

## 5. `chapters`

Suggested columns:

```text
id               uuid PK
book_id          uuid NOT NULL -> books.id
title            text NOT NULL
slug             text NOT NULL
content          jsonb NOT NULL
sort_order       integer NOT NULL
status           chapter_status
created_at       timestamptz NOT NULL DEFAULT now()
updated_at       timestamptz NOT NULL DEFAULT now()
legacy_wp_id     bigint NULL
legacy_url       text NULL
```

Recommended constraints:

```text
UNIQUE(book_id, slug)
UNIQUE(book_id, sort_order)
```

`content` stores the Tiptap document as JSONB.

Do not store `previous_chapter_id` or `next_chapter_id`. Previous/next navigation is derived from `book_id + sort_order` among published chapters.

## 6. `comments`

Suggested columns:

```text
id               uuid PK
chapter_id       uuid NOT NULL -> chapters.id
user_id          uuid NOT NULL -> profiles.id
content          text NOT NULL
status           comment_status
created_at       timestamptz NOT NULL DEFAULT now()
updated_at       timestamptz NOT NULL DEFAULT now()
```

Initial status can be `published` / `deleted` with soft-delete semantics.

## 7. Relationships

```text
auth.users 1 ── 1 profiles
profiles   1 ──< comments
sections   1 ──< books
books      1 ──< chapters
chapters   1 ──< comments
```

## 8. Media

Book covers and in-content images should use Supabase Storage.

Database rows should keep storage paths/identifiers rather than embedding provider secrets or public management credentials.

## 9. Indexes

At minimum, index:

- `books.section_id`
- `chapters.book_id`
- `chapters(book_id, sort_order)`
- `comments.chapter_id`
- `comments.user_id`

## 10. Migration Fields

Keep legacy tracing fields during migration:

- `legacy_wp_id`
- `legacy_url`

These fields allow an imported record to be traced back to WordPress and support redirect mapping.

## 11. Potential Future Entities

Do not add future tables until they are required.

Temporary anonymous protected-section access can be implemented with signed cookies without storing a `section_access` table unless later requirements make persistence/auditing necessary.
