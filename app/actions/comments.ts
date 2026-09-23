"use server";

import { getCurrentProfile } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteChapterComment } from "@/lib/reader/comments";

export type CommentActionState = { message?: string; success?: boolean };

export async function submitCommentAction(
    _previous: CommentActionState | undefined,
    formData: FormData,
): Promise<CommentActionState> {
    try {
        const profile = await getCurrentProfile();
        if (!profile) {
            return { message: "Необходимо войти, чтобы оставить комментарий." };
        }

        const chapterId = String(formData.get("chapterId") ?? "").trim();
        const content = String(formData.get("content") ?? "").trim();

        if (!chapterId) return { message: "Не указана глава." };
        if (!content) return { message: "Введите текст комментария." };
        if (content.length > 5000) {
            return { message: "Комментарий слишком длинный (не более 5000 символов)." };
        }

        const supabase = await createSupabaseServerClient();
        const { error } = await supabase.from("comments").insert({
            chapter_id: chapterId,
            user_id: profile.id,
            content,
        });

        if (error) {
            if (error.code === "42501") {
                return { message: "Нет доступа для создания комментария." };
            }
            return { message: "Не удалось отправить комментарий." };
        }

        return { success: true };
    } catch {
        return { message: "Не удалось отправить комментарий." };
    }
}

export async function deleteCommentAction(commentId: string): Promise<CommentActionState> {
    return deleteChapterComment(commentId);
}
