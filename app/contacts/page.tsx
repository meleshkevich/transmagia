import type { Metadata } from "next";
import Link from "next/link";

import { ReaderHeader } from "@/components/reader/reader-header";

export const metadata: Metadata = {
    title: "Контакты",
    description: "Контакты проекта Трансмагия.",
};

export default function ContactsPage() {
    return (
        <div className="min-h-screen bg-muted/40">
            <ReaderHeader />
            <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8 lg:py-16">
                <Link href="/" className="reader-link">← На главную</Link>
                <article className="mt-10 border border-border bg-background p-7 sm:p-10">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Трансмагия</p>
                    <h1 className="font-reader text-4xl tracking-tight">Контакты</h1>
                    <div className="mt-8 space-y-5 leading-8 text-muted-foreground">
                        <p>По вопросам публикации, переводов и работы сайта свяжитесь с администрацией проекта.</p>
                        <p>Электронная почта: <a className="font-semibold text-foreground underline underline-offset-4" href="mailto:hello@transmagia.house">hello@transmagia.house</a></p>
                    </div>
                </article>
            </main>
        </div>
    );
}
