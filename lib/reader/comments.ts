import "server-only";

import { getCurrentProfile } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canDeleteComment } from "./comment-auth";

export type ChapterComment = {
    id: string;
    content: string;
    createdAt: string;
    authorName: string;
    userId: string | null;
};

export type CommentMutationResult = { message?: string; success?: boolean };

export async function getChapterComments(chapterId: string): Promise<ChapterComment[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id, profiles(display_name)")
        .eq("chapter_id", chapterId)
        .eq("status", "published")
        .order("created_at", { ascending: true });

    if (error) throw new Error("Не удалось получить комментарии.");

    return (data ?? []).map((comment) => {
        const profile = comment.profiles as unknown as { display_name: string | null } | null;
        const authorName =
            profile === null ? "Удалённый пользователь" : (profile.display_name ?? "Читатель");
        return {
            id: comment.id,
            content: comment.content,
            createdAt: comment.created_at,
            authorName,
            userId: (comment.user_id as string | null) ?? null,
        };
    });
}

export async function deleteChapterComment(commentId: string): Promise<CommentMutationResult> {
    const profile = await getCurrentProfile();
    if (!profile) {
        return { message: "Необходимо войти для удаления комментария." };
    }

    const supabase = createSupabaseAdminClient();
    const { data: comment, error: fetchError } = await supabase
        .from("comments")
        .select("user_id, status")
        .eq("id", commentId)
        .maybeSingle();

    if (fetchError || !comment) {
        return { message: "Комментарий не найден." };
    }

    if (comment.status === "deleted") {
        return { message: "Комментарий уже удалён." };
    }

    if (!canDeleteComment(profile, (comment.user_id as string | null) ?? null)) {
        return { message: "Нет прав для удаления этого комментария." };
    }

    const { error: updateError } = await supabase
        .from("comments")
        .update({ status: "deleted" })
        .eq("id", commentId);

    if (updateError) {
        return { message: "Не удалось удалить комментарий." };
    }

    return { success: true };
}

export { canDeleteComment };
