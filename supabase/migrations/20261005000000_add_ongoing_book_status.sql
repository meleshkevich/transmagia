-- Add 'ongoing' to the book_status enum.
-- draft = not public; ongoing = public but unfinished; published = public and finished.
--
-- NOTE: ALTER TYPE ... ADD VALUE cannot be rolled back if the migration is
-- wrapped in a transaction. Split from the function update (next migration)
-- so each statement can commit independently.
alter type public.book_status add value 'ongoing' before 'published';
