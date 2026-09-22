-- Transmagia Phase 2: initial database schema and base RLS.
-- Protected anonymous content remains closed until the Phase 4 access layer exists.

create type public.book_status as enum ('draft', 'published');
create type public.chapter_status as enum ('draft', 'published');
create type public.comment_status as enum ('published', 'deleted');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sections_name_not_blank check (length(btrim(name)) > 0),
  constraint sections_slug_not_blank check (length(btrim(slug)) > 0),
  constraint sections_password_hash_not_blank check (
    password_hash is null or length(btrim(password_hash)) > 0
  )
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete restrict,
  title text not null,
  slug text not null,
  author text,
  description text,
  cover_image_path text,
  status public.book_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  legacy_wp_id bigint,
  legacy_url text,
  constraint books_title_not_blank check (length(btrim(title)) > 0),
  constraint books_slug_not_blank check (length(btrim(slug)) > 0),
  constraint books_section_slug_unique unique (section_id, slug)
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  title text not null,
  slug text not null,
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  sort_order integer not null,
  status public.chapter_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  legacy_wp_id bigint,
  legacy_url text,
  constraint chapters_title_not_blank check (length(btrim(title)) > 0),
  constraint chapters_slug_not_blank check (length(btrim(slug)) > 0),
  constraint chapters_sort_order_positive check (sort_order > 0),
  constraint chapters_content_is_tiptap_document check (
    jsonb_typeof(content) = 'object' and content ->> 'type' = 'doc'
  ),
  constraint chapters_book_slug_unique unique (book_id, slug),
  constraint chapters_book_order_unique unique (book_id, sort_order)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  status public.comment_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_content_not_blank check (length(btrim(content)) > 0)
);

create index books_section_id_idx on public.books (section_id);
create index chapters_book_id_idx on public.chapters (book_id);
create index chapters_book_order_idx on public.chapters (book_id, sort_order);
create index comments_chapter_id_idx on public.comments (chapter_id);
create index comments_user_id_idx on public.comments (user_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger sections_set_updated_at
before update on public.sections
for each row execute function public.set_updated_at();

create trigger books_set_updated_at
before update on public.books
for each row execute function public.set_updated_at();

create trigger chapters_set_updated_at
before update on public.chapters
for each row execute function public.set_updated_at();

create trigger comments_set_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

-- These helpers reveal only whether content is public. They do not expose section hashes.
create or replace function public.is_public_book(book_uuid uuid)
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
      and b.status = 'published'
      and s.password_hash is null
  );
$$;

create or replace function public.is_public_chapter(chapter_uuid uuid)
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
      and c.status = 'published'
      and public.is_public_book(c.book_id)
  );
$$;

grant execute on function public.is_public_book(uuid) to anon, authenticated;
grant execute on function public.is_public_chapter(uuid) to anon, authenticated;

-- Public catalogs receive only safe section fields. The base table remains closed
-- to client roles so password_hash cannot be selected through Supabase APIs.
create view public.section_catalog as
select id, name, slug, description
from public.sections;

grant select on public.section_catalog to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.sections enable row level security;
alter table public.books enable row level security;
alter table public.chapters enable row level security;
alter table public.comments enable row level security;

-- Profiles are private to their owner. Column privileges prevent self-promotion.
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy profiles_update_display_name
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Public catalog metadata and public, published content only. Password-protected
-- sections remain unavailable until the later server-side access layer is added.
create policy books_select_public_published
on public.books
for select
to anon, authenticated
using (public.is_public_book(id));

create policy chapters_select_public_published
on public.chapters
for select
to anon, authenticated
using (public.is_public_chapter(id));

create policy comments_select_public_published
on public.comments
for select
to anon, authenticated
using (status = 'published' and public.is_public_chapter(chapter_id));

create policy comments_insert_own_authenticated
on public.comments
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and public.is_public_chapter(chapter_id)
);

-- Restrict client privileges in addition to RLS. Future server-side admin
-- operations can use a trusted server role and later explicit admin policies.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

revoke all on table public.sections from anon, authenticated;
revoke all on table public.books from anon, authenticated;
grant select on table public.books to anon, authenticated;
revoke all on table public.chapters from anon, authenticated;
grant select on table public.chapters to anon, authenticated;
revoke all on table public.comments from anon, authenticated;
grant select on table public.comments to anon, authenticated;
grant insert (chapter_id, user_id, content) on table public.comments to authenticated;

-- Storage foundations only. Covers are public presentation assets; in-content
-- images remain private until the later server-side access layer is implemented.
insert into storage.buckets (id, name, public)
values
  ('book-covers', 'book-covers', true),
  ('content-images', 'content-images', false)
on conflict (id) do nothing;

create policy book_covers_read_public
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'book-covers');

insert into public.sections (name, slug, description)
values
  ('Оригинальные новеллы', 'originals', 'Истории, созданные авторами Трансмагии.'),
  ('Фанфики', 'fanfiction', 'Новые грани знакомых миров и героев.'),
  ('Переводы', 'translations', 'Избранные произведения со всего мира.')
on conflict (slug) do nothing;
