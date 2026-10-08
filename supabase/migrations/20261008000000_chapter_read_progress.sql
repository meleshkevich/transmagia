-- Transmagia: per-user chapter reading progress.
-- Authorization strategy: server-side only via the service-role client.
-- The app authenticates the user, verifies chapter access (including the
-- translations password cookie), then uses the service-role client to
-- write only the current user's progress. RLS is enabled as a defence-
-- in-depth layer; the primary enforcement is the server-side access layer.

create table public.chapter_read_progress (
    user_id    uuid        not null references auth.users(id) on delete cascade,
    chapter_id uuid        not null references public.chapters(id) on delete cascade,
    read_at    timestamptz not null default now(),
    primary key (user_id, chapter_id)
);

-- Index on chapter_id speeds up FK integrity checks and the per-book
-- batch query that loads a user's read chapters for a given book.
create index chapter_read_progress_chapter_id_idx
    on public.chapter_read_progress (chapter_id);

alter table public.chapter_read_progress enable row level security;

-- Authenticated users may read only their own progress rows.
-- Mutations are performed exclusively via the service-role client on the
-- server, so no client-facing INSERT/UPDATE/DELETE policies are needed.
create policy chapter_read_progress_select_own
    on public.chapter_read_progress
    for select
    to authenticated
    using (user_id = (select auth.uid()));

-- Grant select only; the server uses the service-role key for writes.
revoke all on table public.chapter_read_progress from anon, authenticated;
grant select on table public.chapter_read_progress to authenticated;
