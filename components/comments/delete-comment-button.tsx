"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteCommentAction } from "@/app/actions/comments";

export function DeleteCommentButton({ commentId }: { commentId: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    function handleDelete() {
        if (!window.confirm("Удалить комментарий?")) return;
        startTransition(async () => {
            const result = await deleteCommentAction(commentId);
            if (result.success) {
                router.refresh();
            } else if (result.message) {
                window.alert(result.message);
            }
        });
    }

    return (
        <button
            type="button"
            className="comment-delete-button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Удалить комментарий"
        >
            {isPending ? "…" : "Удалить"}
        </button>
    );
}
