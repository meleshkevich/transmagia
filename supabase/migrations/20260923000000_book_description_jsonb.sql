-- Change books.description from plain text to Tiptap JSON (jsonb).
-- Existing non-null text values are wrapped into a minimal valid Tiptap document
-- so that no data is lost during the migration.
alter table public.books
    alter column description type jsonb
    using case
        when description is null then null
        else jsonb_build_object(
            'type', 'doc',
            'content', jsonb_build_array(
                jsonb_build_object(
                    'type', 'paragraph',
                    'content', jsonb_build_array(
                        jsonb_build_object('type', 'text', 'text', description)
                    )
                )
            )
        )
    end;
