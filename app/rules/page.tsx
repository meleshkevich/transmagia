import type { Metadata } from "next";
import Link from "next/link";

import { ReaderHeader } from "@/components/reader/reader-header";

export const metadata: Metadata = {
    title: "Правила пользования сайтом",
    description: "Правила пользования сайтом Трансмагия.",
};

export default function RulesPage() {
    return (
        <div className="min-h-screen bg-muted/40">
            <ReaderHeader />
            <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8 lg:py-16">
                <Link href="/" className="reader-link">← На главную</Link>
                <article className="mt-10 border border-border bg-background p-7 sm:p-10">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Трансмагия</p>
                    <h1 className="font-reader text-4xl tracking-tight">Правила пользования сайтом</h1>
                    <div className="mt-8 space-y-5 leading-8 text-muted-foreground">
                        <p>Уважайте авторов, переводчиков и других читателей. Публикация материалов осуществляется с соблюдением авторских прав.</p>
                        <p>Не размещайте спам, оскорбления, персональные данные и материалы, нарушающие законодательство.</p>
                        <p>Администрация может скрыть комментарии и ограничить доступ к материалам при нарушении правил.</p>
                    </div>
                </article>
            </main>
        </div>
    );
}
