"use client";

import { useTransition } from "react";

import { adminDeleteCommentAction } from "@/app/actions/admin-comments";

export function DeleteCommentButton({ commentId }: { commentId: string }) {
    const [pending, startTransition] = useTransition();

    function handleClick() {
        if (!confirm("Удалить этот комментарий? Действие нельзя отменить.")) return;
        startTransition(async () => {
            await adminDeleteCommentAction(commentId);
        });
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            className="admin-table-action admin-table-action-danger"
        >
            {pending ? "Удаление…" : "Удалить"}
        </button>
    );
}
