"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { adminGetUsersAction } from "@/app/actions/admin-users";
import { AccordionSection } from "@/components/ui/accordion-section";
import { PageLoadingSpinner } from "@/components/ui/page-loading-spinner";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { UserRoleButton } from "@/components/admin/user-role-button";
import type { AdminUser } from "@/lib/admin/users";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

interface UsersListAccordionProps {
    currentUserId: string;
    version: number;
    onUserAction: () => void;
}

type FetchStatus = "idle" | "loading" | "success" | "error";

export function UsersListAccordion({ currentUserId, version, onUserAction }: UsersListAccordionProps) {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState<FetchStatus>("idle");
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fetchedVersionRef = useRef(-1);
    const isFetchingRef = useRef(false);

    const loadUsers = useCallback(async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        const targetVersion = version;
        setStatus("loading");
        setError(null);
        try {
            const result = await adminGetUsersAction();
            if (result.error) {
                setStatus("error");
                setError(result.error);
            } else {
                setUsers(result.users ?? []);
                setStatus("success");
                fetchedVersionRef.current = targetVersion;
            }
        } catch {
            setStatus("error");
            setError("Не удалось загрузить список пользователей.");
        } finally {
            isFetchingRef.current = false;
        }
    }, [version]);

    useEffect(() => {
        if (!open) return;
        if (isFetchingRef.current) return;
        if (fetchedVersionRef.current >= version) return;
        loadUsers();
    }, [open, version, loadUsers]);

    return (
        <AccordionSection
            title="Список пользователей"
            open={open}
            onOpenChange={setOpen}
        >
            {status === "loading" && <PageLoadingSpinner />}

            {status === "error" && (
                <div className="admin-accordion-error">
                    <p role="alert">{error}</p>
                    <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={loadUsers}
                    >
                        Повторить
                    </button>
                </div>
            )}

            {status === "success" && (
                <div className="admin-table-wrap admin-accordion-table">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Имя</th>
                                <th>Роль</th>
                                <th>Права</th>
                                <th>Зарегистрирован</th>
                                <th>Удалить</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <span className="admin-table-title" style={{ cursor: "default", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                            {u.emailConfirmedAt && (
                                                <span title="Email подтверждён">
                                                    <CheckCircle2
                                                        size={14}
                                                        className="text-green-600 dark:text-green-500 shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    <span className="sr-only">Email подтверждён</span>
                                                </span>
                                            )}
                                            {u.email ?? "—"}
                                        </span>
                                    </td>
                                    <td>{u.displayName ?? <span className="admin-table-subtitle">Не указано</span>}</td>
                                    <td>
                                        <span className={`admin-status ${u.isAdmin ? "admin-status-published" : "admin-status-draft"}`}>
                                            {u.isAdmin ? "Администратор" : "Читатель"}
                                        </span>
                                    </td>
                                    <td>
                                        <UserRoleButton
                                            userId={u.id}
                                            isCurrentlyAdmin={u.isAdmin}
                                            isSelf={u.id === currentUserId}
                                            onSuccess={onUserAction}
                                        />
                                    </td>
                                    <td>
                                        <time dateTime={u.createdAt}>
                                            {dateFormat.format(new Date(u.createdAt))}
                                        </time>
                                    </td>
                                    <td>
                                        <DeleteUserButton
                                            userId={u.id}
                                            isSelf={u.id === currentUserId}
                                            onSuccess={onUserAction}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && (
                        <p className="admin-empty">Пользователей пока нет.</p>
                    )}
                </div>
            )}
        </AccordionSection>
    );
}
