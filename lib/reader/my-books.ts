import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAllPages } from "@/lib/reader/reading-progress";
import type { ReaderBook } from "@/lib/reader/data";

export type MyBooksSection = {
    sectionId: string;
    sectionSlug: string;
    sectionName: string;
    books: ReaderBook[];
};

const SECTION_SLUG_ORDER = ["originals", "fanfiction", "translations"];

/**
 * Returns all books the user has started reading, grouped by section in
 * canonical order (originals → fanfiction → translations).
 *
 * Uses the admin client throughout — no section password check is performed,
 * so translation books appear even when the user hasn't entered the password.
 * Opening an individual translation book still goes through the SectionGate.
 */
export async function getMyBooks(userId: string): Promise<MyBooksSection[]> {
    const supabase = createSupabaseAdminClient();

    type ProgressRow = { chapters: { book_id: string } };
    let progressRows: ProgressRow[];
    try {
        progressRows = (await fetchAllPages((from, to) =>
            supabase
                .from("chapter_read_progress")
                .select("chapters!inner(book_id)")
                .eq("user_id", userId)
                .range(from, to),
        )) as unknown as ProgressRow[];
    } catch {
        throw new Error("Не удалось получить прогресс чтения.");
    }

    if (progressRows.length === 0) {
        return [];
    }

    const bookIds = [...new Set(progressRows.map((r) => r.chapters.book_id))];

    const { data: bookRows, error: booksError } = await supabase
        .from("books")
        .select("id, section_id, title, slug, author, author_sort_order, description, cover_image_path, status")
        .in("id", bookIds)
        .in("status", ["ongoing", "published"]);

    if (booksError) throw new Error("Не удалось получить книги.");
    if (!bookRows || bookRows.length === 0) return [];

    const sectionIds = [...new Set(bookRows.map((b) => b.section_id as string))];
    const { data: sectionRows, error: sectionsError } = await supabase
        .from("sections")
        .select("id, name, slug")
        .in("id", sectionIds);

    if (sectionsError) throw new Error("Не удалось получить разделы.");

    const sectionMap = new Map(
        (sectionRows ?? []).map((s) => [s.id as string, s as { id: string; name: string; slug: string }]),
    );

    const books: ReaderBook[] = await Promise.all(
        bookRows.map(async (book) => {
            const section = sectionMap.get(book.section_id as string);
            let coverImageUrl: string | null = null;
            if (book.cover_image_path) {
                const { data } = supabase.storage
                    .from("book-covers")
                    .getPublicUrl(book.cover_image_path as string);
                coverImageUrl = data.publicUrl;
            }
            return {
                id: book.id as string,
                sectionId: book.section_id as string,
                sectionSlug: section?.slug ?? "",
                title: book.title as string,
                slug: book.slug as string,
                author: (book.author ?? null) as string | null,
                authorSortOrder: book.author_sort_order as number,
                description: (book.description ?? null) as Record<string, unknown> | null,
                coverImageUrl,
                status: book.status as "ongoing" | "published",
            };
        }),
    );

    const booksBySection = new Map<
        string,
        { section: { id: string; name: string; slug: string }; books: ReaderBook[] }
    >();
    for (const book of books) {
        const section = sectionMap.get(book.sectionId);
        if (!section) continue;
        const entry = booksBySection.get(section.slug);
        if (entry) {
            entry.books.push(book);
        } else {
            booksBySection.set(section.slug, { section, books: [book] });
        }
    }

    return SECTION_SLUG_ORDER.filter((slug) => booksBySection.has(slug)).map((slug) => {
        const { section, books: sectionBooks } = booksBySection.get(slug)!;
        return {
            sectionId: section.id,
            sectionSlug: section.slug,
            sectionName: section.name,
            books: sectionBooks,
        };
    });
}
