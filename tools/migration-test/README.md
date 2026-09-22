# One-off WordPress chapter migration test

Temporary Phase 5 migration tooling for the first real source-page test. It is intentionally not application UI or a generic migration system.

Run from the project root with server-only environment variables loaded:

```bash
node --env-file=.env.local tools/migration-test/import-wordpress-chapter.mjs
```

The script:

- fetches the fixed WordPress chapter URL;
- extracts only `article > .post-content`;
- removes WordPress presentation/comments/navigation elements;
- converts cleaned HTML to Tiptap JSON with StarterKit and Image;
- uploads genuine source images to the private `content-images` bucket under `<bookId>/migration-test/`;
- inserts a draft chapter into the existing `Шум дождя` book;
- refuses duplicate imports by `legacy_url`.

It requires the temporary parser packages `cheerio` and `jsdom` to be available in the local workspace. It uses `SUPABASE_SERVICE_ROLE_KEY` only in this server-side script and must never be imported into browser code.
