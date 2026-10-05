-- Update can_read_book to treat 'ongoing' the same as 'published' for access.
-- draft = not public; ongoing = public but unfinished; published = public and finished.
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
          b.status in ('ongoing', 'published')
          and (
            s.password_hash is null
            or public.has_profile()
          )
        )
      )
  );
$$;
