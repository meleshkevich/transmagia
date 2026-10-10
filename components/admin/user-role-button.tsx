"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldMinus, ShieldPlus } from "lucide-react";

import { adminDemoteUserAction, adminPromoteUserAction } from "@/app/actions/admin-users";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface UserRoleButtonProps {
    userId: string;
    isCurrentlyAdmin: boolean;
    isSelf: boolean;
}

export function UserRoleButton({ userId, isCurrentlyAdmin, isSelf }: UserRoleButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string>();
    const [pending, startTransition] = useTransition();

    const ariaLabel = isCurrentlyAdmin ? "Снять права администратора" : "Сделать администратором";
    const dialogTitle = isCurrentlyAdmin ? "Снять права администратора?" : "Назначить администратором?";
    const confirmLabel = isCurrentlyAdmin ? "Снять права" : "Назначить";

    function handleClose() {
        if (pending) return;
        setOpen(false);
        setError(undefined);
    }

    function handleConfirm() {
        setError(undefined);
        startTransition(async () => {
            const result = isCurrentlyAdmin
                ? await adminDemoteUserAction(userId)
                : await adminPromoteUserAction(userId);
            if (result.message) {
                setError(result.message);
            } else {
                setOpen(false);
                router.refresh();
            }
        });
    }

    if (isSelf && isCurrentlyAdmin) {
        return (
            <button
                type="button"
                disabled
                className="admin-table-action"
                aria-label="Снять права администратора"
                title="Нельзя снять права администратора у самого себя"
            >
                <ShieldMinus aria-hidden="true" />
            </button>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={pending}
                className="admin-table-action"
                aria-label={ariaLabel}
                title={ariaLabel}
            >
                {isCurrentlyAdmin
                    ? <ShieldMinus aria-hidden="true" />
                    : <ShieldPlus className="text-green-700 dark:text-green-400" aria-hidden="true" />
                }
            </button>
            <ConfirmDialog
                open={open}
                onClose={handleClose}
                onConfirm={handleConfirm}
                title={dialogTitle}
                confirmLabel={confirmLabel}
                loading={pending}
                errorMessage={error}
            />
        </>
    );
}
