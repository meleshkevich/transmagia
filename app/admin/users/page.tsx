import { CreateUserForm } from "@/components/admin/create-user-form";
import { UserRoleButton } from "@/components/admin/user-role-button";
import { requireAdmin } from "@/lib/auth/server";
import { getAdminUsers } from "@/lib/admin/users";

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
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
                            <th>Зарегистрирован</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>
                                    <span className="admin-table-title" style={{ cursor: "default" }}>
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
                                    <time dateTime={u.createdAt}>
                                        {dateFormat.format(new Date(u.createdAt))}
                                    </time>
                                </td>
                                <td>
                                    <UserRoleButton
                                        userId={u.id}
                                        isCurrentlyAdmin={u.isAdmin}
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
