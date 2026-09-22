import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, getCurrentUser, requireAdmin } from "@/lib/auth/server";
import { hashSectionPassword, verifySectionPassword } from "@/lib/auth/passwords";
import { grantSectionAccess, hasValidSectionAccess } from "@/lib/auth/section-access";

type SectionRecord = {
    id: string;
    password_hash: string | null;
};

type ReadableChapter = {
    id: string;
    book_id: string;
    title: string;
    slug: string;
    content: Record<string, unknown>;
    sort_order: number;
    status: "draft" | "published";
};

async function getSection(sectionId: string): Promise<SectionRecord | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("sections")
        .select("id, password_hash")
        .eq("id", sectionId)
        .maybeSingle();

    if (error) {
        throw new Error("Не удалось получить раздел.");
    }

    return data;
}

export async function canReadSection(sectionId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (user && (await getCurrentProfile())) {
        return true;
    }

    const section = await getSection(sectionId);
    if (!section) {
        return false;
    }
    if (section.password_hash === null) {
        return true;
    }

    return hasValidSectionAccess(sectionId);
}

export async function canReadBook(bookId: string): Promise<boolean> {
    const supabase = createSupabaseAdminClient();
    const { data: book, error } = await supabase
        .from("books")
        .select("id, section_id, status")
        .eq("id", bookId)
        .maybeSingle();

    if (error) {
        throw new Error("Не удалось получить книгу.");
    }
    if (!book) {
        return false;
    }

    const profile = await getCurrentProfile();
    if (profile?.is_admin) {
        return true;
    }
    if (book.status !== "published") {
        return false;
    }

    return canReadSection(book.section_id);
}

export async function canReadChapter(chapterId: string): Promise<boolean> {
    const supabase = createSupabaseAdminClient();
    const { data: chapter, error } = await supabase
        .from("chapters")
        .select("book_id, status")
        .eq("id", chapterId)
        .maybeSingle();

    if (error) {
        throw new Error("Не удалось получить главу.");
    }
    if (!chapter) {
        return false;
    }

    const profile = await getCurrentProfile();
    if (profile?.is_admin) {
        return true;
    }
    if (chapter.status !== "published") {
        return false;
    }

    return canReadBook(chapter.book_id);
}

export async function requireReadableChapter(chapterId: string): Promise<ReadableChapter> {
    if (!(await canReadChapter(chapterId))) {
        throw new Error("Доступ к главе запрещён.");
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("chapters")
        .select("id, book_id, title, slug, content, sort_order, status")
        .eq("id", chapterId)
        .single();

    if (error || !data) {
        throw new Error("Не удалось получить главу.");
    }

    return data as ReadableChapter;
}

export async function verifyAndGrantSectionAccess(
    sectionId: string,
    password: string,
): Promise<boolean> {
    const user = await getCurrentUser();
    if (user && (await getCurrentProfile())) {
        return true;
    }

    const section = await getSection(sectionId);
    if (!section?.password_hash) {
        return section !== null;
    }

    const valid = await verifySectionPassword(password, section.password_hash);
    if (!valid) {
        return false;
    }

    await grantSectionAccess(sectionId);
    return true;
}

export async function setSectionPassword(
    sectionId: string,
    password: string | null,
): Promise<void> {
    await requireAdmin();
    const passwordHash = password ? await hashSectionPassword(password) : null;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
        .from("sections")
        .update({ password_hash: passwordHash })
        .eq("id", sectionId);

    if (error) {
        throw new Error("Не удалось изменить пароль раздела.");
    }
}
