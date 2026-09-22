# Transmagia Project Documents

This directory contains the agreed project specification and implementation architecture for the Transmagia rebuild.

## Reading Order

1. `PROJECT_SPEC.md` — product requirements and fixed decisions
2. `DATABASE.md` — PostgreSQL/Supabase data model
3. `ACCESS_CONTROL.md` — authentication and authorization rules
4. `APPLICATION_ARCHITECTURE.md` — routes, rendering, server/client boundaries
5. `UI_PWA.md` — design, reader UX, responsive rules, PWA
6. `MIGRATION.md` — WordPress migration strategy
7. `IMPLEMENTATION_PLAN.md` — implementation phases and acceptance criteria

## How to use with Claude

Use `PROJECT_SPEC.md` as the product context and the architecture documents as constraints.

Use `IMPLEMENTATION_PLAN.md` as the execution order. Ask Claude to implement one phase/task at a time, run the required checks, and stop at the acceptance criteria before moving to the next task.

Do not ask Claude to rebuild the entire application in one prompt.

## Important Fixed Decisions

- Stack: Next.js + TypeScript + Supabase
- Editor: Tiptap OSS/MIT only
- UI: shadcn/ui + Tailwind CSS + Lucide
- Language: Russian only in v1
- Reader: PWA, mobile-first
- Admin: desktop/tablet-first, phone secondary
- Public catalogs: Originals, Fanfiction, Translations
- Book/chapter content in those sections: protected by section password for anonymous users
- Registered readers and admins bypass section passwords
- Anonymous section access: signed HTTP-only temporary cookie
- Authorization: server-side; frontend hiding is never sufficient
- WordPress migration: manually supplied book URLs + automated chapter extraction
