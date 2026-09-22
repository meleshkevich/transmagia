-- Transmagia Phase 3: authentication, profiles, and authenticated access.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, is_admin, display_name)
  values (
    new.id,
    false,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.has_profile()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_admin = true
  );
$$;

create or replace function public.can_read_book(book_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.books as b
    join public.sections as s on s.id = b.section_id
    where b.id = book_uuid
      and (
        public.is_admin()
        or (
          b.status = 'published'
          and (
            s.password_hash is null
            or public.has_profile()
          )
        )
      )
  );
$$;

create or replace function public.can_read_chapter(chapter_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.chapters as c
    where c.id = chapter_uuid
      and public.can_read_book(c.book_id)
      and (c.status = 'published' or public.is_admin())
  );
$$;

grant execute on function public.has_profile() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_read_book(uuid) to anon, authenticated;
grant execute on function public.can_read_chapter(uuid) to anon, authenticated;

-- Replace Phase 2 public-only policies with the authenticated access model.
drop policy books_select_public_published on public.books;
create policy books_select_allowed_content
on public.books
for select
to anon, authenticated
using (public.can_read_book(id));

drop policy chapters_select_public_published on public.chapters;
create policy chapters_select_allowed_content
on public.chapters
for select
to anon, authenticated
using (public.can_read_chapter(id));

drop policy comments_select_public_published on public.comments;
create policy comments_select_allowed_content
on public.comments
for select
to anon, authenticated
using (
  status = 'published'
  and public.can_read_chapter(chapter_id)
);

drop policy comments_insert_own_authenticated on public.comments;
create policy comments_insert_own_authenticated
on public.comments
for insert
to authenticated
with check (
  public.has_profile()
  and (select auth.uid()) = user_id
  and public.can_read_chapter(chapter_id)
);

-- Keep direct client mutations closed. Admin mutations will use explicit
-- server-side authorization in later CMS phases.
revoke insert, update, delete on table public.books from authenticated;
revoke insert, update, delete on table public.chapters from authenticated;
revoke update, delete on table public.comments from authenticated;
