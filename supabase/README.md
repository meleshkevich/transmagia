# Supabase database workflow

The database schema is defined in `supabase/migrations/` and should be applied with the Supabase CLI or through a linked Supabase project. The project currently does not include the CLI as an npm dependency.

## Local workflow

Install the Supabase CLI using the official method for your operating system, then from the project root:

```bash
supabase start
supabase db reset
supabase db lint
```

`supabase db reset` applies all migrations to the local database from a clean state. For a linked project, use the normal Supabase CLI `db push` workflow after reviewing the migration.

## Phase 2 verification queries

Run these against the target database after applying the migration:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'sections', 'books', 'chapters', 'comments')
order by table_name;

select tablename, rowsecurity
from pg_catalog.pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'sections', 'books', 'chapters', 'comments')
order by tablename;

select slug, name
from public.section_catalog
order by slug;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'is_registered';
```

The final query must return zero rows. The public section view intentionally omits `password_hash`; clients must not select the base `sections` table.

Comments retain their content when a profile is deleted: `comments.user_id` is nullable and uses `ON DELETE SET NULL`. Comment presenters should render a null author as `Удалённый пользователь`.

Verify the comment ownership behavior after applying the migration:

```sql
select is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'comments'
  and column_name = 'user_id';

select delete_rule
from information_schema.referential_constraints
where constraint_schema = 'public'
  and constraint_name = 'comments_user_id_fkey';
```

These queries must return `YES` and `SET NULL`. The `comments_insert_own_authenticated` policy still requires `auth.uid() = user_id`, so authenticated clients cannot assign another user's ID; `NULL` is reserved for the deletion action.

## Phase 3 authentication and access

The `20260922020000_phase3_auth_access.sql` migration adds an `auth.users` trigger that creates a profile with `is_admin = false` for every new account. The application resolves the current user with Supabase Auth, then resolves the trusted role from `profiles.is_admin`.

The application server uses the publishable Supabase key for normal session-aware queries and a server-only service-role client only inside authorization helpers after the request has been authenticated. The service-role client is never imported by client components.

Anonymous protected-section access is represented by a cookie named for the section ID. Its signed payload contains only the section ID and expiration. The signing key is `SUPABASE_ACCESS_COOKIE_SECRET`, which must be at least 32 characters and must never use a `NEXT_PUBLIC_` name. `SECTION_ACCESS_TTL_SECONDS` controls the lifetime and defaults to seven days.

The section cookie is `HttpOnly`, `SameSite=Lax`, scoped to `/`, and `Secure` in production. It grants access only to its matching section and never grants a user profile, comment permission, or admin access.
