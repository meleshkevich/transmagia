import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canReadChapter, canReadSection } from "@/lib/auth/access";

type SectionRow = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    password_hash: string | null;
};

export type ReaderSection = Omit<SectionRow, "password_hash"> & {
    isProtected: boolean;
};

export type ReaderBook = {
    id: string;
    sectionId: string;
    sectionSlug: string;
    title: string;
    slug: string;
    author: string | null;
    description: string | null;
    coverImageUrl: string | null;
};

export type ReaderChapterSummary = {
    id: string;
    title: string;
    slug: string;
    sortOrder: number;
    status: "draft" | "published";
};

export type ReaderChapter = ReaderChapterSummary & {
    bookId: string;
    content: Record<string, unknown>;
};

async function getSectionRowBySlug(slug: string): Promise<SectionRow | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("sections")
        .select("id, name, slug, description, password_hash")
        .eq("slug", slug)
        .maybeSingle();

    if (error) {
        throw new Error("Не удалось получить раздел.");
    }

    return data;
}

function toReaderSection(section: SectionRow): ReaderSection {
    const { password_hash: passwordHash, ...safeSection } = section;
    return { ...safeSection, isProtected: passwordHash !== null };
}

export async function getReaderSection(slug: string): Promise<ReaderSection | null> {
    const section = await getSectionRowBySlug(slug);
    return section ? toReaderSection(section) : null;
}

async function getCoverUrl(path: string | null): Promise<string | null> {
    if (!path) {
        return null;
    }

    const supabase = createSupabaseAdminClient();
    const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
    return data.publicUrl;
}

function mapBook(book: {
    id: string;
    section_id: string;
    title: string;
    slug: string;
    author: string | null;
    description: string | null;
    cover_image_path: string | null;
}, section: SectionRow): ReaderBook {
    return {
        id: book.id,
        sectionId: book.section_id,
        sectionSlug: section.slug,
        title: book.title,
        slug: book.slug,
        author: book.author,
        description: book.description,
        coverImageUrl: null,
    };
}

export async function getPublishedBooks(sectionSlug: string): Promise<ReaderBook[]> {
    const section = await getSectionRowBySlug(sectionSlug);
    if (!section) {
        return [];
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("books")
        .select("id, section_id, title, slug, author, description, cover_image_path")
        .eq("section_id", section.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error("Не удалось получить каталог книг.");
    }

    return Promise.all(
        (data ?? []).map(async (book) => ({
            ...mapBook(book, section),
            coverImageUrl: await getCoverUrl(book.cover_image_path),
        })),
    );
}

export async function getPublishedBook(
    sectionSlug: string,
    bookSlug: string,
): Promise<{ section: ReaderSection; book: ReaderBook } | null> {
    const section = await getSectionRowBySlug(sectionSlug);
    if (!section) {
        return null;
    }

    const supabase = createSupabaseAdminClient();
    const { data: book, error } = await supabase
        .from("books")
        .select("id, section_id, title, slug, author, description, cover_image_path")
        .eq("section_id", section.id)
        .eq("slug", bookSlug)
        .eq("status", "published")
        .maybeSingle();

    if (error) {
        throw new Error("Не удалось получить книгу.");
    }
    if (!book) {
        return null;
    }

    return {
        section: toReaderSection(section),
        book: {
            ...mapBook(book, section),
            coverImageUrl: await getCoverUrl(book.cover_image_path),
        },
    };
}

export async function getPublishedChapters(bookId: string): Promise<ReaderChapterSummary[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("chapters")
        .select("id, title, slug, sort_order, status")
        .eq("book_id", bookId)
        .eq("status", "published")
        .order("sort_order", { ascending: true });

    if (error) {
        throw new Error("Не удалось получить список глав.");
    }

    return (data ?? []).map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        slug: chapter.slug,
        sortOrder: chapter.sort_order,
        status: chapter.status,
    }));
}

export async function getPublishedChapterMetadata(
    sectionSlug: string,
    bookSlug: string,
    chapterSlug: string,
): Promise<{ book: ReaderBook; chapter: ReaderChapterSummary } | null> {
    const bookResult = await getPublishedBook(sectionSlug, bookSlug);
    if (!bookResult) {
        return null;
    }

    const supabase = createSupabaseAdminClient();
    const { data: chapter, error } = await supabase
        .from("chapters")
        .select("id, title, slug, sort_order, status")
        .eq("book_id", bookResult.book.id)
        .eq("slug", chapterSlug)
        .eq("status", "published")
        .maybeSingle();

    if (error || !chapter) {
        return null;
    }

    return {
        book: bookResult.book,
        chapter: {
            id: chapter.id,
            title: chapter.title,
            slug: chapter.slug,
            sortOrder: chapter.sort_order,
            status: chapter.status,
        },
    };
}

export async function getChapterPageData(
    sectionSlug: string,
    bookSlug: string,
    chapterSlug: string,
): Promise<{
    section: ReaderSection;
    book: ReaderBook;
    chapter: ReaderChapterSummary;
    content: Record<string, unknown> | null;
    canRead: boolean;
    chapters: ReaderChapterSummary[];
} | null> {
    const bookResult = await getPublishedBook(sectionSlug, bookSlug);
    if (!bookResult) {
        return null;
    }

    const supabase = createSupabaseAdminClient();
    const { data: chapter, error } = await supabase
        .from("chapters")
        .select("id, book_id, title, slug, sort_order, status")
        .eq("book_id", bookResult.book.id)
        .eq("slug", chapterSlug)
        .maybeSingle();

    if (error) {
        throw new Error("Не удалось получить главу.");
    }
    if (!chapter || chapter.status !== "published") {
        return null;
    }

    const chapters = await getPublishedChapters(bookResult.book.id);
    const readable = await canReadChapter(chapter.id);
    if (!readable) {
        return {
            ...bookResult,
            chapter: {
                id: chapter.id,
                title: chapter.title,
                slug: chapter.slug,
                sortOrder: chapter.sort_order,
                status: chapter.status,
            },
            content: null,
            canRead: false,
            chapters,
        };
    }

    const { data: contentRow, error: contentError } = await supabase
        .from("chapters")
        .select("content")
        .eq("id", chapter.id)
        .single();

    if (contentError || !contentRow) {
        throw new Error("Не удалось получить текст главы.");
    }

    return {
        ...bookResult,
        chapter: {
            id: chapter.id,
            title: chapter.title,
            slug: chapter.slug,
            sortOrder: chapter.sort_order,
            status: chapter.status,
        },
        content: contentRow.content as Record<string, unknown>,
        canRead: true,
        chapters,
    };
}

export async function hasSectionAccess(sectionId: string): Promise<boolean> {
    return canReadSection(sectionId);
}
