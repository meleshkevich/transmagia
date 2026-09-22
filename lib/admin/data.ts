import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/server";

export type AdminSection = {
    id: string;
    name: string;
    slug: string;
};

export type AdminBook = {
    id: string;
    sectionId: string;
    sectionName: string;
    sectionSlug: string;
    title: string;
    slug: string;
    author: string | null;
    description: string | null;
    coverImagePath: string | null;
    coverImageUrl: string | null;
    status: "draft" | "published";
    updatedAt: string;
    chapterCount: number;
};

export type AdminChapter = {
    id: string;
    bookId: string;
    title: string;
    slug: string;
    sortOrder: number;
    status: "draft" | "published";
    updatedAt: string;
};

export async function getAdminSections(): Promise<AdminSection[]> {
    await requireAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("sections")
        .select("id, name, slug")
        .order("name");

    if (error) throw new Error("Не удалось получить разделы.");
    return data ?? [];
}

function getCoverImageUrl(path: string | null): string | null {
    if (!path) return null;
    const supabase = createSupabaseAdminClient();
    return supabase.storage.from("book-covers").getPublicUrl(path).data.publicUrl;
}

function mapBook(book: {
    id: string;
    section_id: string;
    title: string;
    slug: string;
    author: string | null;
    description: string | null;
    cover_image_path: string | null;
    status: "draft" | "published";
    updated_at: string;
    sections: { name: string; slug: string } | null;
    chapters: { count: number }[];
}): AdminBook {
    return {
        id: book.id,
        sectionId: book.section_id,
        sectionName: book.sections?.name ?? "Без раздела",
        sectionSlug: book.sections?.slug ?? "",
        title: book.title,
        slug: book.slug,
        author: book.author,
        description: book.description,
        coverImagePath: book.cover_image_path,
        coverImageUrl: getCoverImageUrl(book.cover_image_path),
        status: book.status,
        updatedAt: book.updated_at,
        chapterCount: book.chapters?.[0]?.count ?? 0,
    };
}

export async function getAdminBooks(): Promise<AdminBook[]> {
    await requireAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("books")
        .select("id, section_id, title, slug, author, description, cover_image_path, status, updated_at, sections(name, slug), chapters(count)")
        .order("updated_at", { ascending: false });

    if (error) throw new Error("Не удалось получить список книг.");
    return (data ?? []).map((book) => mapBook(book as never));
}

export async function getAdminBook(bookId: string): Promise<AdminBook | null> {
    await requireAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("books")
        .select("id, section_id, title, slug, author, description, cover_image_path, status, updated_at, sections(name, slug), chapters(count)")
        .eq("id", bookId)
        .maybeSingle();

    if (error) throw new Error("Не удалось получить книгу.");
    return data ? mapBook(data as never) : null;
}

export async function getAdminChapters(bookId: string): Promise<AdminChapter[]> {
    await requireAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("chapters")
        .select("id, book_id, title, slug, sort_order, status, updated_at")
        .eq("book_id", bookId)
        .order("sort_order");

    if (error) throw new Error("Не удалось получить список глав.");
    return (data ?? []).map((chapter) => ({
        id: chapter.id,
        bookId: chapter.book_id,
        title: chapter.title,
        slug: chapter.slug,
        sortOrder: chapter.sort_order,
        status: chapter.status,
        updatedAt: chapter.updated_at,
    }));
}

export async function getAdminChapter(chapterId: string): Promise<{
    chapter: AdminChapter;
    content: Record<string, unknown>;
} | null> {
    await requireAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("chapters")
        .select("id, book_id, title, slug, sort_order, status, updated_at, content")
        .eq("id", chapterId)
        .maybeSingle();

    if (error) throw new Error("Не удалось получить главу.");
    if (!data) return null;

    return {
        chapter: {
            id: data.id,
            bookId: data.book_id,
            title: data.title,
            slug: data.slug,
            sortOrder: data.sort_order,
            status: data.status,
            updatedAt: data.updated_at,
        },
        content: data.content as Record<string, unknown>,
    };
}
