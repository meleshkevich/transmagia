-- Preserve historical comments when their author profile is deleted.

alter table public.comments
  alter column user_id drop not null;

alter table public.comments
  drop constraint comments_user_id_fkey;

alter table public.comments
  add constraint comments_user_id_fkey
  foreign key (user_id)
  references public.profiles (id)
  on delete set null;