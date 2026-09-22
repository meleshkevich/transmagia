import "server-only";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { optionalText, parsePositiveInteger, parseStatus, requiredText, slugify, validateImage } from "@/lib/admin/validation";

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MAX_CONTENT_IMAGE_BYTES = 10 * 1024 * 1024;

export type MutationState = { message?: string };

function errorMessage(error: unknown, fallback: string): MutationState {
    return { message: error instanceof Error ? error.message : fallback };
}

async function uploadImage(file: File, bucket: "book-covers" | "content-images", folder: string): Promise<string> {
    const extension = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const path = `${folder}/${randomUUID()}.${extension}`;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from(bucket).upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: false,
    });
    if (error) throw new Error("Не удалось загрузить изображение.");
    return path;
}

async function uniqueSlug(table: "books" | "chapters", baseSlug: string, scopeColumn: string, scopeValue: string): Promise<string> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from(table)
        .select("slug")
        .eq(scopeColumn, scopeValue)
        .like("slug", `${baseSlug}%`);
    if (error) throw new Error("Не удалось подготовить адрес записи.");

    const used = new Set((data ?? []).map((row) => row.slug));
    if (!used.has(baseSlug)) return baseSlug;
    let suffix = 2;
    while (used.has(`${baseSlug}-${suffix}`)) suffix += 1;
    return `${baseSlug}-${suffix}`;
}

export async function createBook(formData: FormData): Promise<MutationState> {
    try {
        const { user } = await requireAdmin();
        const title = requiredText(formData.get("title"), "Введите название книги.");
        const sectionId = requiredText(formData.get("sectionId"), "Выберите раздел.");
        const author = optionalText(formData.get("author"));
        const description = optionalText(formData.get("description"));
        const status = parseStatus(formData.get("status"), formData.get("publish"));
        const cover = validateImage(formData.get("cover"), MAX_COVER_BYTES);
        const supabase = createSupabaseAdminClient();
        const coverImagePath = cover ? await uploadImage(cover, "book-covers", user.id) : null;
        const slug = await uniqueSlug("books", slugify(title), "section_id", sectionId);
        const { data, error } = await supabase.from("books").insert({
            section_id: sectionId,
            title,
            slug,
            author,
            description,
            cover_image_path: coverImagePath,
            status,
        }).select("id").single();
        if (error || !data) throw new Error("Не удалось сохранить книгу.");
        revalidatePath("/admin/books");
        revalidatePath(`/admin/books/${data.id}`);
        return {};
    } catch (error) {
        return errorMessage(error, "Не удалось сохранить книгу.");
    }
}

export async function updateBook(bookId: string, formData: FormData): Promise<MutationState> {
    try {
        const { user } = await requireAdmin();
        const title = requiredText(formData.get("title"), "Введите название книги.");
        const sectionId = requiredText(formData.get("sectionId"), "Выберите раздел.");
        const author = optionalText(formData.get("author"));
        const description = optionalText(formData.get("description"));
        const status = parseStatus(formData.get("status"), formData.get("publish"));
        const cover = validateImage(formData.get("cover"), MAX_COVER_BYTES);
        const supabase = createSupabaseAdminClient();
        const { data: existing, error: existingError } = await supabase.from("books").select("slug, cover_image_path").eq("id", bookId).single();
        if (existingError || !existing) throw new Error("Книга не найдена.");
        const coverImagePath = cover ? await uploadImage(cover, "book-covers", user.id) : existing.cover_image_path;
        const { error } = await supabase.from("books").update({
            section_id: sectionId,
            title,
            author,
            description,
            cover_image_path: coverImagePath,
            status,
        }).eq("id", bookId);
        if (error) throw new Error("Не удалось сохранить книгу.");
        revalidatePath("/admin/books");
        revalidatePath(`/admin/books/${bookId}`);
        return {};
    } catch (error) {
        return errorMessage(error, "Не удалось сохранить книгу.");
    }
}

export async function createChapter(bookId: string, formData: FormData): Promise<MutationState> {
    try {
        const { user } = await requireAdmin();
        const title = requiredText(formData.get("title"), "Введите название главы.");
        const content = parseContent(formData.get("content"));
        const status = parseStatus(formData.get("status"), formData.get("publish"));
        const sortOrder = parsePositiveInteger(formData.get("sortOrder"));
        const supabase = createSupabaseAdminClient();
        const { data: book, error: bookError } = await supabase.from("books").select("id").eq("id", bookId).maybeSingle();
        if (bookError || !book) throw new Error("Книга не найдена.");
        const slug = await uniqueSlug("chapters", slugify(title), "book_id", bookId);
        const { error } = await supabase.from("chapters").insert({
            book_id: bookId,
            title,
            slug,
            content,
            sort_order: sortOrder,
            status,
        });
        if (error) throw new Error("Не удалось сохранить главу.");
        void user;
        revalidatePath(`/admin/books/${bookId}`);
        revalidatePath(`/admin/books/${bookId}/chapters`);
        revalidatePath(`/admin/books/${bookId}/chapters/new`);
        return {};
    } catch (error) {
        return errorMessage(error, "Не удалось сохранить главу.");
    }
}

export async function updateChapter(chapterId: string, formData: FormData): Promise<MutationState> {
    try {
        await requireAdmin();
        const title = requiredText(formData.get("title"), "Введите название главы.");
        const content = parseContent(formData.get("content"));
        const status = parseStatus(formData.get("status"), formData.get("publish"));
        const sortOrder = parsePositiveInteger(formData.get("sortOrder"));
        const supabase = createSupabaseAdminClient();
        const { data: existing, error: existingError } = await supabase.from("chapters").select("book_id, slug").eq("id", chapterId).single();
        if (existingError || !existing) throw new Error("Глава не найдена.");
        const { error } = await supabase.from("chapters").update({ title, content, status, sort_order: sortOrder }).eq("id", chapterId);
        if (error) throw new Error("Не удалось сохранить главу.");
        revalidatePath(`/admin/books/${existing.book_id}`);
        revalidatePath(`/admin/books/${existing.book_id}/chapters/${chapterId}/edit`);
        revalidatePath(`/admin/books/${existing.book_id}/chapters`);
        revalidatePath("/", "layout");
        return {};
    } catch (error) {
        return errorMessage(error, "Не удалось сохранить главу.");
    }
}

export async function reorderChapters(bookId: string, orderedChapterIds: string[]): Promise<MutationState> {
    try {
        await requireAdmin();
        if (orderedChapterIds.length === 0) return {};
        const supabase = createSupabaseAdminClient();
        const { data: chapters, error: loadError } = await supabase.from("chapters").select("id").eq("book_id", bookId);
        if (loadError || !chapters || chapters.length !== orderedChapterIds.length) throw new Error("Не удалось проверить порядок глав.");
        const allowed = new Set(chapters.map((chapter) => chapter.id));
        if (orderedChapterIds.some((id) => !allowed.has(id)) || new Set(orderedChapterIds).size !== orderedChapterIds.length) throw new Error("Некорректный порядок глав.");
        for (const [index, chapterId] of orderedChapterIds.entries()) {
            const { error } = await supabase.from("chapters").update({ sort_order: 1000000 + index }).eq("id", chapterId);
            if (error) throw new Error("Не удалось сохранить порядок глав.");
        }
        for (const [index, chapterId] of orderedChapterIds.entries()) {
            const { error } = await supabase.from("chapters").update({ sort_order: index + 1 }).eq("id", chapterId);
            if (error) throw new Error("Не удалось сохранить порядок глав.");
        }
        revalidatePath(`/admin/books/${bookId}`);
        revalidatePath(`/admin/books/${bookId}/chapters`);
        return {};
    } catch (error) {
        return errorMessage(error, "Не удалось сохранить порядок глав.");
    }
}

export async function uploadContentImage(bookId: string, formData: FormData): Promise<{ path?: string; message?: string }> {
    try {
        const { user } = await requireAdmin();
        const file = validateImage(formData.get("image"), MAX_CONTENT_IMAGE_BYTES);
        if (!file) throw new Error("Выберите изображение.");
        const supabase = createSupabaseAdminClient();
        const { data: book, error } = await supabase.from("books").select("id").eq("id", bookId).maybeSingle();
        if (error || !book) throw new Error("Книга не найдена.");
        return { path: await uploadImage(file, "content-images", `${bookId}/${user.id}`) };
    } catch (error) {
        return errorMessage(error, "Не удалось загрузить изображение.");
    }
}

function parseContent(value: FormDataEntryValue | null): Record<string, unknown> {
    if (typeof value !== "string") throw new Error("Содержимое главы не найдено.");
    try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        if (parsed.type !== "doc" || !Array.isArray(parsed.content)) throw new Error();
        return parsed;
    } catch {
        throw new Error("Содержимое главы имеет неверный формат.");
    }
}
