import type { ReactNode } from "react";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
    await requireAdmin();

    return (
        <div className="min-h-screen bg-muted/40">
            <header className="border-b border-border bg-background">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
                    <Link href="/" className="font-reader text-xl font-semibold">Трансмагия</Link>
                    <span className="text-sm font-semibold text-muted-foreground">Админка</span>
                </div>
            </header>
            <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 lg:flex-row lg:px-8">
                <aside className="admin-sidebar">
                    <nav aria-label="Навигация админки">
                        <Link href="/admin/books">Книги</Link>
                        <Link href="/admin/comments">Комментарии</Link>
                        <Link href="/admin/users">Пользователи</Link>
                        <span>Разделы</span>
                    </nav>
                </aside>
                <main className="min-w-0 flex-1">{children}</main>
            </div>
        </div>
    );
}
