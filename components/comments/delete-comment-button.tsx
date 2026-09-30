"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteCommentAction } from "@/app/actions/comments";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteCommentButton({ commentId }: { commentId: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string>();
    const [pending, startTransition] = useTransition();

    function handleClose() {
        if (pending) return;
        setOpen(false);
        setError(undefined);
    }

    function handleConfirm() {
        setError(undefined);
        startTransition(async () => {
            const result = await deleteCommentAction(commentId);
            if (result.success) {
                setOpen(false);
                router.refresh();
            } else if (result.message) {
                setError(result.message);
            }
        });
    }

    return (
        <>
            <button
                type="button"
                className="comment-delete-button"
                onClick={() => setOpen(true)}
                disabled={pending}
                aria-label="Удалить комментарий"
            >
                {pending ? "…" : "Удалить"}
            </button>
            <ConfirmDialog
                open={open}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title="Удалить комментарий?"
                description="Это действие нельзя отменить."
                confirmLabel="Удалить"
                destructive
                loading={pending}
                errorMessage={error}
            />
        </>
    );
}
