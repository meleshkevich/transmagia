import { CheckCircle2 } from "lucide-react";

import { CreateUserForm } from "@/components/admin/create-user-form";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { UserRoleButton } from "@/components/admin/user-role-button";
import { requireAdmin } from "@/lib/auth/server";
import { getAdminUsers } from "@/lib/admin/users";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

export default async function AdminUsersPage() {
    const [{ user }, users] = await Promise.all([
        requireAdmin(),
        getAdminUsers(),
    ]);

    return (
        <section>
            <div className="admin-page-heading">
                <div>
                    <p className="admin-eyebrow">Управление</p>
                    <h1>Пользователи</h1>
                    <p className="admin-muted">Зарегистрированные читатели и администраторы.</p>
                </div>
            </div>

            <div className="admin-panel" style={{ marginBottom: "2rem" }}>
                <h2>Создать пользователя</h2>
                <CreateUserForm />
            </div>

            <div className="admin-table-wrap">
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
                                        isSelf={u.id === user.id}
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
                                        isSelf={u.id === user.id}
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
        </section>
    );
}
