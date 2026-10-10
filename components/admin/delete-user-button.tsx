"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { adminDeleteUserAction } from "@/app/actions/admin-users";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface DeleteUserButtonProps {
    userId: string;
    isSelf: boolean;
}

const DESCRIPTION = (
    <>
        Будут навсегда удалены учётная запись и профиль этого пользователя.{" "}
        Комментарии этого пользователя будут анонимизированы.{" "}
        Книги и главы останутся без изменений.
        <br />
        <br />
        Это действие нельзя отменить.
    </>
);

export function DeleteUserButton({ userId, isSelf }: DeleteUserButtonProps) {
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
            const result = await adminDeleteUserAction(userId);
            if (result.message) {
                setError(result.message);
            } else {
                setOpen(false);
                router.refresh();
            }
        });
    }

    if (isSelf) {
        return (
            <button
                type="button"
                disabled
                className="admin-table-action admin-table-action-danger"
                aria-label="Удалить пользователя"
                title="Нельзя удалить собственную учётную запись"
            >
                <Trash2 aria-hidden="true" />
            </button>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="admin-table-action admin-table-action-danger"
                aria-label="Удалить пользователя"
                title="Удалить пользователя"
            >
                <Trash2 aria-hidden="true" />
            </button>
            <ConfirmDialog
                open={open}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title="Удалить пользователя?"
                description={DESCRIPTION}
                confirmLabel="Удалить"
                destructive
                loading={pending}
                errorMessage={error}
            />
        </>
    );
}
