"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { adminDemoteUserAction, adminPromoteUserAction } from "@/app/actions/admin-users";

interface UserRoleButtonProps {
    userId: string;
    isCurrentlyAdmin: boolean;
    isSelf: boolean;
}

export function UserRoleButton({ userId, isCurrentlyAdmin, isSelf }: UserRoleButtonProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    function handleClick() {
        const message = isCurrentlyAdmin
            ? "Снять права администратора у этого пользователя?"
            : "Назначить этого пользователя администратором?";

        if (!confirm(message)) return;

        startTransition(async () => {
            const result = isCurrentlyAdmin
                ? await adminDemoteUserAction(userId)
                : await adminPromoteUserAction(userId);

            if (result.message) {
                alert(result.message);
            } else {
                router.refresh();
            }
        });
    }

    if (isSelf && isCurrentlyAdmin) {
        return (
            <span className="admin-table-action" style={{ opacity: 0.4, cursor: "not-allowed" }} title="Нельзя снять права у себя">
                Снять права
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            className="admin-table-action"
        >
            {pending
                ? "Изменение…"
                : isCurrentlyAdmin
                    ? "Снять права"
                    : "Сделать администратором"}
        </button>
    );
}
