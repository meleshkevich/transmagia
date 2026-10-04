-- Phase: book ordering within author groups.
-- Adds author_sort_order (1..N per section×author group) with a safe backfill.

-- 1. Add nullable first so we can backfill before enforcing NOT NULL.
alter table public.books add column author_sort_order integer;

-- 2. Backfill all existing books deterministically.
--    Groups: (section_id, COALESCE(btrim(author), ''))
--    Order within group: created_at ASC, id ASC
--
--    Disable the books_set_updated_at trigger so the backfill UPDATE does not
--    overwrite existing updated_at timestamps (trigger sets updated_at = now()
--    on every row touched by any UPDATE).
alter table public.books disable trigger books_set_updated_at;

with ranked as (
  select
    id,
    row_number() over (
      partition by section_id, coalesce(btrim(author), '')
      order by created_at asc, id asc
    ) as rn
  from public.books
)
update public.books
set author_sort_order = ranked.rn
from ranked
where public.books.id = ranked.id;

alter table public.books enable trigger books_set_updated_at;

-- 3. Enforce NOT NULL now that every row has a value.
alter table public.books alter column author_sort_order set not null;

-- 4. Unique index treating NULL and empty/whitespace author as the same group.
--    A normal UNIQUE(section_id, author, author_sort_order) would allow
--    multiple NULLs because NULL != NULL in SQL.
create unique index books_section_author_order_unique
  on public.books (section_id, coalesce(btrim(author), ''), author_sort_order);

-- 5. Covering index to speed up catalog and ordering queries.
create index books_section_author_order_idx
  on public.books (section_id, author, author_sort_order);

-- ─── Helper: get next sort order for a (section, author) group ────────────────

create or replace function public.get_next_author_sort_order(
  p_section_id uuid,
  p_author      text   -- pass null or '' for the unknown-author group
)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(max(author_sort_order), 0) + 1
  from public.books
  where section_id = p_section_id
    and coalesce(btrim(author), '') = coalesce(btrim(p_author), '');
$$;

-- ─── Core: atomic in-group reorder ────────────────────────────────────────────

-- Reorders a book within its (section, author) group.
-- Uses row-by-row ordered shifts to avoid violating the non-deferrable unique
-- index (section_id, COALESCE(btrim(author),''), author_sort_order):
--   moving toward front → shift siblings DESC (highest first, each into a free slot above)
--   moving toward back  → shift siblings ASC  (lowest first, each into a free slot below)
create or replace function public.move_book_in_author_group(
  p_book_id      uuid,
  p_new_position integer
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_section_id  uuid;
  v_author_key  text;
  v_current_pos integer;
  v_max_pos     integer;
  v_target_pos  integer;
  r             record;
begin
  -- Lock the target book row.
  select section_id, coalesce(btrim(author), ''), author_sort_order
  into   v_section_id, v_author_key, v_current_pos
  from   public.books
  where  id = p_book_id
  for update;

  if not found then
    raise exception 'Book not found: %', p_book_id;
  end if;

  -- Lock the entire sibling group to prevent concurrent conflicts.
  perform 1
  from    public.books
  where   section_id = v_section_id
    and   coalesce(btrim(author), '') = v_author_key
  for update;

  -- Determine max position in the group.
  select max(author_sort_order)
  into   v_max_pos
  from   public.books
  where  section_id = v_section_id
    and  coalesce(btrim(author), '') = v_author_key;

  -- Clamp requested position to valid range [1, max].
  v_target_pos := greatest(1, least(p_new_position, v_max_pos));

  -- No-op when already at the target position.
  if v_target_pos = v_current_pos then
    return;
  end if;

  -- Temporarily move the book out of the way (position 0 is never a valid
  -- position in the 1..N invariant, so this never conflicts with siblings).
  update public.books set author_sort_order = 0 where id = p_book_id;

  if v_target_pos < v_current_pos then
    -- Moving toward the front: shift [target, current-1] by +1.
    -- Process DESC so each row moves into a slot already freed by the row above it;
    -- the highest row in the range always has a free slot at pos+1 (book is at 0).
    for r in
      select id, author_sort_order as pos
      from   public.books
      where  section_id = v_section_id
        and  coalesce(btrim(author), '') = v_author_key
        and  author_sort_order >= v_target_pos
        and  author_sort_order <= v_current_pos - 1
      order  by author_sort_order desc
    loop
      update public.books set author_sort_order = r.pos + 1 where id = r.id;
    end loop;
  else
    -- Moving toward the back: shift [current+1, target] by -1.
    -- Process ASC so each row moves into a slot already freed by the row below it;
    -- the lowest row in the range always moves into v_current_pos, now free.
    for r in
      select id, author_sort_order as pos
      from   public.books
      where  section_id = v_section_id
        and  coalesce(btrim(author), '') = v_author_key
        and  author_sort_order >= v_current_pos + 1
        and  author_sort_order <= v_target_pos
      order  by author_sort_order asc
    loop
      update public.books set author_sort_order = r.pos - 1 where id = r.id;
    end loop;
  end if;

  -- Place the book at its final position.
  update public.books set author_sort_order = v_target_pos where id = p_book_id;
end;
$$;

-- ─── Core: atomic group reassignment (author or section change) ────────────────

-- Removes the book from its current (section, author) group, compacts that
-- group, then atomically places the book at the end of the destination group
-- by updating section_id, author, and author_sort_order in a single statement.
-- Returns the new author_sort_order.
--
-- The caller (mutations.ts) must NOT repeat section_id/author in any subsequent
-- UPDATE for the same book, as those are already set here atomically.
create or replace function public.reassign_book_author_group(
  p_book_id      uuid,
  p_new_section  uuid,
  p_new_author   text   -- pass null or '' for unknown-author group
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old_section    uuid;
  v_old_author_key text;
  v_old_pos        integer;
  v_new_author_key text;
  v_new_pos        integer;
  r                record;
begin
  -- Lock the book row.
  select section_id, coalesce(btrim(author), ''), author_sort_order
  into   v_old_section, v_old_author_key, v_old_pos
  from   public.books
  where  id = p_book_id
  for update;

  if not found then
    raise exception 'Book not found: %', p_book_id;
  end if;

  v_new_author_key := coalesce(btrim(p_new_author), '');

  -- No-op when already in the same group.
  if v_old_section = p_new_section and v_old_author_key = v_new_author_key then
    return v_old_pos;
  end if;

  -- Lock old group siblings (excluding this book).
  perform 1
  from    public.books
  where   section_id = v_old_section
    and   coalesce(btrim(author), '') = v_old_author_key
    and   id != p_book_id
  for update;

  -- Lock new group siblings (excluding this book, which may not be there yet).
  perform 1
  from    public.books
  where   section_id = p_new_section
    and   coalesce(btrim(author), '') = v_new_author_key
    and   id != p_book_id
  for update;

  -- Move book to position 0 to vacate v_old_pos before compacting the old group.
  -- Without this step the first compact shift (into v_old_pos) would collide with
  -- the book still occupying that position.
  update public.books set author_sort_order = 0 where id = p_book_id;

  -- Compact old group: shift positions above v_old_pos down by 1.
  -- Process ASC: each row moves into the slot just freed by the previous shift
  -- (v_old_pos is free since the book is now at 0).
  for r in
    select id, author_sort_order as pos
    from   public.books
    where  section_id = v_old_section
      and  coalesce(btrim(author), '') = v_old_author_key
      and  author_sort_order > v_old_pos
      and  id != p_book_id
    order  by author_sort_order asc
  loop
    update public.books set author_sort_order = r.pos - 1 where id = r.id;
  end loop;

  -- Find append position in the destination group.
  -- Exclude this book (its section_id/author still point to the old group).
  select coalesce(max(author_sort_order), 0) + 1
  into   v_new_pos
  from   public.books
  where  section_id = p_new_section
    and  coalesce(btrim(author), '') = v_new_author_key
    and  id != p_book_id;

  -- Atomically place the book in the destination group.
  -- All three ordering-sensitive columns are updated in one statement so the
  -- row is never in a transient inconsistent state.
  update public.books
  set    section_id        = p_new_section,
         author            = p_new_author,
         author_sort_order = v_new_pos
  where  id = p_book_id;

  return v_new_pos;
end;
$$;

-- ─── Compact helper (used after deletion) ─────────────────────────────────────

-- Re-assigns contiguous 1..N positions to all books in a group.
-- Uses a row-by-row loop ordered ASC; each update writes a position that is
-- always <= the current value so no two live rows ever share a position.
create or replace function public.compact_author_group(
  p_section_id uuid,
  p_author     text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_new_pos integer := 1;
begin
  -- Lock all books in the group.
  perform 1
  from    public.books
  where   section_id = p_section_id
    and   coalesce(btrim(author), '') = coalesce(btrim(p_author), '')
  for update;

  -- Reassign contiguous positions ordered by current author_sort_order.
  for r in
    select id
    from   public.books
    where  section_id = p_section_id
      and  coalesce(btrim(author), '') = coalesce(btrim(p_author), '')
    order  by author_sort_order asc
  loop
    update public.books set author_sort_order = v_new_pos where id = r.id;
    v_new_pos := v_new_pos + 1;
  end loop;
end;
$$;

-- Revoke PUBLIC EXECUTE before granting to service_role.
-- These functions are SECURITY DEFINER and bypass RLS; anon and authenticated
-- roles must not be able to call them via the PostgREST RPC endpoint.
revoke execute on function public.get_next_author_sort_order(uuid, text) from public;
revoke execute on function public.move_book_in_author_group(uuid, integer) from public;
revoke execute on function public.reassign_book_author_group(uuid, uuid, text) from public;
revoke execute on function public.compact_author_group(uuid, text) from public;

-- Grant execute to the service role used by the admin client only.
grant execute on function public.get_next_author_sort_order(uuid, text) to service_role;
grant execute on function public.move_book_in_author_group(uuid, integer) to service_role;
grant execute on function public.reassign_book_author_group(uuid, uuid, text) to service_role;
grant execute on function public.compact_author_group(uuid, text) to service_role;
