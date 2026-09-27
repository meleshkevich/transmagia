-- Phase 7C: clear fabricated test descriptions so real WordPress content can be imported.
-- Only books.description is nulled; all other fields are preserved.
update public.books
set description = null, updated_at = now()
where title in ('Шум дождя', 'Пески времени или Обратный отсчёт')
  and description is not null;
