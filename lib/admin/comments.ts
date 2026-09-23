import "server-only";

import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminComment = {
    id: string;
    content: string;
    status: "published" | "deleted";
    createdAt: string;
    authorName: string;
    chapterTitle: string;
    bookId: string;
    bookTitle: string;
};

export async function getAdminComments(): Promise<AdminComment[]> {
    await requireAdmin();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("comments")
        .select("id, content, status, created_at, profiles(display_name), chapters(id, title, book_id, books(id, title))")
        .order("created_at", { ascending: false });

    if (error) throw new Error("Не удалось получить комментарии.");

    return (data ?? []).map((comment) => {
        const profile = comment.profiles as unknown as { display_name: string | null } | null;
        const chapter = comment.chapters as unknown as {
            id: string;
            title: string;
            book_id: string;
            books: { id: string; title: string } | null;
        } | null;

        return {
            id: comment.id,
            content: comment.content,
            status: comment.status as "published" | "deleted",
            createdAt: comment.created_at,
            authorName: profile?.display_name ?? "Удалённый пользователь",
            chapterTitle: chapter?.title ?? "Неизвестная глава",
            bookId: chapter?.books?.id ?? "",
            bookTitle: chapter?.books?.title ?? "Неизвестная книга",
        };
    });
}

export async function adminSoftDeleteComment(commentId: string): Promise<{ message?: string }> {
    try {
        await requireAdmin();
        const supabase = createSupabaseAdminClient();
        const { error } = await supabase
            .from("comments")
            .update({ status: "deleted" })
            .eq("id", commentId);

        if (error) throw new Error("Не удалось удалить комментарий.");
        return {};
    } catch (error) {
        return { message: error instanceof Error ? error.message : "Не удалось удалить комментарий." };
    }
}
