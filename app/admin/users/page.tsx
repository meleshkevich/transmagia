import { AdminUsersAccordions } from "@/components/admin/admin-users-accordions";
import { requireAdmin } from "@/lib/auth/server";

export default async function AdminUsersPage() {
    const { user } = await requireAdmin();

    return (
        <section>
            <div className="admin-page-heading">
                <div>
                    <p className="admin-eyebrow">Управление</p>
                    <h1>Пользователи</h1>
                    <p className="admin-muted">Зарегистрированные читатели и администраторы.</p>
                </div>
            </div>

            <AdminUsersAccordions currentUserId={user.id} />
        </section>
    );
}
