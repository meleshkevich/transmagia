-- Phase 7D: Remove the obsolete test fixture for "Пески времени или Обратный отсчёт"
-- that was created manually before the real WordPress import.
--
-- Safety checks (all must pass or the migration raises an exception):
--   • exact UUID matches the known test fixture;
--   • title, section slug, and null legacy identity are confirmed;
--   • no chapters are attached.
--
-- The real migrated book (86a0c92e-a53d-41f3-bf23-ef13fd9aba29) is NOT touched.

DO $$
DECLARE
  target_id  uuid    := '2ce25f55-2357-45c1-838c-215c447df50e';
  ch_count   integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   public.books b
    JOIN   public.sections s ON s.id = b.section_id
    WHERE  b.id            = target_id
      AND  b.title         = 'Пески времени или Обратный отсчёт'
      AND  s.slug          = 'originals'
      AND  b.legacy_wp_id  IS NULL
      AND  b.legacy_url    IS NULL
  ) THEN
    RAISE EXCEPTION
      'Safety check failed: book % does not match expected conditions (title/section/null legacy identity). Aborting.',
      target_id;
  END IF;

  SELECT COUNT(*) INTO ch_count
  FROM   public.chapters
  WHERE  book_id = target_id;

  IF ch_count > 0 THEN
    RAISE EXCEPTION
      'Safety check failed: book % has % chapter(s). Aborting.',
      target_id, ch_count;
  END IF;

  DELETE FROM public.books WHERE id = target_id;

  RAISE NOTICE 'Deleted test fixture % (Пески времени или Обратный отсчёт, originals, no legacy identity).', target_id;
END $$;
