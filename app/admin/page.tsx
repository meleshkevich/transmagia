import Link from "next/link";

export default function AdminPage() {
    return (
        <section className="border border-border bg-background p-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Защищённый маршрут</p>
            <h1 className="font-reader text-3xl tracking-tight">Панель администратора</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">Доступ подтверждён сервером. Начните с управления книгами и главами.</p>
            <Link href="/admin/books" className="admin-primary-button mt-6">Открыть книги</Link>
        </section>
    );
}
