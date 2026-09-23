"use server";

import { revalidatePath } from "next/cache";

import { adminSoftDeleteComment } from "@/lib/admin/comments";

export async function adminDeleteCommentAction(commentId: string): Promise<{ message?: string }> {
    const result = await adminSoftDeleteComment(commentId);
    if (!result.message) {
        revalidatePath("/admin/comments");
    }
    return result;
}
