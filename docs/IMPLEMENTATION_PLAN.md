# Transmagia — Implementation Plan

## 0. Working Method

Implement the application incrementally.

Do not attempt to build the entire project in one step.

For each phase:

```text
Implement
→ Run checks/tests
→ Review result
→ Commit/checkpoint
→ Continue
```

Every coding task should state:

- Goal
- Scope
- Files/components affected
- Database changes
- Security requirements
- Acceptance criteria
- Explicit non-goals

## Phase 1 — Project Bootstrap

Goal: create the Next.js project and establish the development foundation.

Tasks:

- initialize Next.js + TypeScript;
- configure Tailwind CSS;
- initialize shadcn/ui;
- install Lucide Icons;
- configure Supabase client/server access;
- configure environment variables;
- establish basic lint/type-check/test commands;
- establish the base app layout;
- add initial Russian UI shell;
- configure PWA foundation.

Acceptance criteria:

- app starts locally;
- type checking passes;
- linting passes;
- Supabase connection is configured safely;
- no secrets are exposed to the browser.

## Phase 2 — Database Schema

Goal: implement the core PostgreSQL schema.

Create:

- `profiles`;
- `sections`;
- `books`;
- `chapters`;
- `comments`;
- enums/constraints/indexes/triggers as appropriate.

Also configure Supabase Storage buckets/policies needed for covers and images.

Acceptance criteria:

- schema migrations are reproducible;
- foreign keys and unique constraints work;
- timestamps are maintained;
- Tiptap JSONB content works;
- legacy migration fields exist.

## Phase 3 — Authentication and Roles

Goal: implement email/password authentication and profile roles.

Tasks:

- login;
- registration;
- current-user resolution;
- profile creation;
- `is_admin` handling;
- logout;
- protected admin route boundary.

Acceptance criteria:

- new accounts become non-admin readers by default;
- registered readers can sign in/out;
- admins can be identified securely server-side;
- unauthenticated users cannot access admin operations.

## Phase 4 — Access Control

Goal: implement public/protected section reading and anonymous password access.

Tasks:

- public catalogs;
- protected book/chapter access checks;
- section password hashing;
- password verification server action/route;
- signed HTTP-only temporary section-access cookie;
- admin/registered bypass;
- RLS/server-side protection;
- negative authorization tests.

Acceptance criteria:

- anonymous visitor cannot read protected chapter content without access;
- guest with valid section cookie can read the section;
- registered reader never needs section password;
- admin never needs section password;
- invalid/expired access is rejected;
- protected content is not fetched client-side before authorization.

## Phase 5 — Public Reader

Goal: make the site useful as a reader.

Tasks:

- home/about page;
- section catalog pages;
- book pages;
- chapter pages;
- previous/next navigation;
- back-to-book navigation;
- rules;
- contacts;
- Russian UI.

Acceptance criteria:

- public catalog works without login;
- protected book/chapter gate works correctly;
- navigation follows published chapter order;
- first/last chapter edge cases work;
- long chapters render cleanly.

## Phase 6 — Reader UX and PWA

Goal: make reading comfortable on phones and installable as a PWA.

Tasks:

- manifest/icons;
- standalone display;
- service worker/app shell caching;
- reader typography;
- `Aa` preferences UI;
- font-size control;
- line-height control;
- Light/Dark/System theme;
- local persistence;
- mobile/tablet responsive tuning;
- accessibility checks.

Acceptance criteria:

- PWA installability works where supported;
- reader is comfortable on phone-sized screens;
- preferences persist between sessions;
- zoom/pinch/text scaling are not blocked;
- protected content is not globally cached by the service worker.

## Phase 7 — Admin CMS: Books and Sections

Goal: implement core content administration.

Tasks:

- admin shell/navigation;
- books list;
- create/edit book;
- section assignment;
- cover upload;
- section management;
- section password settings.

Acceptance criteria:

- only admins can perform mutations;
- creating a book is simple;
- cover upload works;
- section password can be changed without exposing plaintext;
- tablet UI remains usable.

## Phase 8 — Admin CMS: Chapters and Tiptap

Goal: implement the primary authoring workflow.

Tasks:

- chapter list;
- add chapter;
- edit chapter;
- Tiptap OSS/MIT editor;
- save draft;
- preview;
- publish/unpublish;
- reorder chapters;
- delete/archive behavior as defined during implementation.

Acceptance criteria:

- common workflow is fast:

```text
Create book
→ Add chapter
→ Write/paste
→ Preview
→ Publish
```

- Tiptap content round-trips correctly;
- preview matches reader rendering;
- chapter ordering updates previous/next navigation automatically;
- draft chapters are not publicly readable.

## Phase 9 — Comments

Goal: implement reader comments and admin moderation.

Tasks:

- chapter comments display;
- comment form for registered users;
- server authorization;
- moderation/delete UI for admins;
- soft-delete behavior if used.

Acceptance criteria:

- anonymous guests cannot comment;
- registered readers and admins can comment;
- users cannot create comments pretending to be another account;
- admins can remove comments.

## Phase 10 — User Administration

Goal: allow admins to register readers and manage admin privileges.

Tasks:

- create/register reader workflow;
- user list;
- promote to admin;
- demote from admin;
- safe server-side authorization.

Acceptance criteria:

- new readers are non-admin by default;
- only admins can change admin status;
- no role can be self-escalated from the client.

## Phase 11 — WordPress Migration Tool

Goal: migrate the existing archive safely.

Tasks:

- define input CSV/JSON format for manually supplied book URLs + sections;
- build read-only WordPress fetch layer;
- extract chapter links from each book Page;
- retrieve posts;
- normalize HTML;
- convert to Tiptap-compatible JSON;
- migrate media;
- preserve legacy IDs/URLs;
- generate validation report;
- support dry-run mode.

Acceptance criteria:

- one real book can be imported end-to-end;
- chapter order matches the old book Page;
- all imported content can be traced to WordPress;
- failures are reported rather than silently skipped.

## Phase 12 — Production Migration and Redirects

Goal: migrate the complete archive and preserve external links.

Tasks:

- full dry run;
- review report;
- production import;
- storage migration;
- legacy URL redirects;
- post-import integrity checks.

Acceptance criteria:

- counts reconcile;
- material warnings are resolved or explicitly accepted;
- sample chapters match source content;
- redirects work for representative old URLs.

## Phase 13 — Hardening and Launch

Goal: prepare for real users.

Tasks:

- security review;
- authorization tests;
- RLS verification;
- protected-content leakage tests;
- responsive QA;
- PWA QA;
- performance checks;
- backups;
- error handling/logging;
- production environment setup;
- domain switch.

Acceptance criteria:

- access matrix behaves correctly;
- no service-role credentials leak;
- protected content cannot be fetched without authorization;
- reader works on phone/tablet/desktop;
- admin works on desktop/tablet;
- production deployment is reproducible.

## Suggested Checkpoints

Use small checkpoints after at least:

```text
Phase 1 — Bootstrap
Phase 2 — Database
Phase 4 — Access control
Phase 5 — Reader
Phase 8 — Authoring
Phase 11 — Migration prototype
Phase 13 — Launch
```

## Explicit Non-Goals for v1

Do not add unless explicitly requested:

- multilingual UI;
- full offline library;
- real-time collaborative editing;
- Tiptap paid platform features;
- complex threaded comments;
- voting/reactions;
- generic CMS page-builder abstractions;
- mobile-first full CMS authoring.
