import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Send } from "lucide-react";

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
                        <p>По любому вопросу с нами можно связаться следующим образом:</p>
                        <div className="space-y-3">
                            <a href="mailto:iv.venscher@gmail.com" className="flex items-center gap-3 text-foreground hover:text-muted-foreground transition-colors">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border">
                                    <Mail className="h-4 w-4" />
                                </span>
                                <span>iv.venscher@gmail.com</span>
                            </a>
                            <a href="https://t.me/bruxa31" className="flex items-center gap-3 text-foreground hover:text-muted-foreground transition-colors">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border">
                                    <Send className="h-4 w-4" />
                                </span>
                                <span>@bruxa31</span>
                            </a>
                        </div>
                    </div>
                </article>
            </main>
        </div>
    );
}
