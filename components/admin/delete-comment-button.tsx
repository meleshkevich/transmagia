"use client";

import { useState, useTransition } from "react";

import { adminDeleteCommentAction } from "@/app/actions/admin-comments";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteCommentButton({ commentId }: { commentId: string }) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    function handleConfirm() {
        startTransition(async () => {
            await adminDeleteCommentAction(commentId);
            setOpen(false);
        });
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={pending}
                className="admin-table-action admin-table-action-danger"
            >
                {pending ? "Удаление…" : "Удалить"}
            </button>
            <ConfirmDialog
                open={open}
                onClose={() => !pending && setOpen(false)}
                onConfirm={handleConfirm}
                title="Удалить комментарий?"
                description="Это действие нельзя отменить."
                confirmLabel="Удалить"
                destructive
                loading={pending}
            />
        </>
    );
}
