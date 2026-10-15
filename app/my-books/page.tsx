import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { BookCard } from "@/components/reader/book-card";
import { ReaderHeader } from "@/components/reader/reader-header";
import { getCurrentProfile } from "@/lib/auth/server";
import { getMyBooks } from "@/lib/reader/my-books";
import { getPublishedChapterIdsByBook, getReadChapterIdsForBooks } from "@/lib/reader/reading-progress";
import { getCompletedBookIds } from "@/lib/reader/book-completion";

export const metadata: Metadata = { title: "Мои книги" };

export default async function MyBooksPage() {
    const profile = await getCurrentProfile();
    if (!profile) {
        redirect("/login?next=/my-books");
    }

    const sections = await getMyBooks(profile.id);
    const allBooks = sections.flatMap((s) => s.books);

    let completedBookIds = new Set<string>();
    if (allBooks.length > 0) {
        const bookIds = allBooks.map((b) => b.id);
        const [publishedByBook, readIds] = await Promise.all([
            getPublishedChapterIdsByBook(bookIds),
            getReadChapterIdsForBooks(profile.id, bookIds),
        ]);
        completedBookIds = getCompletedBookIds(publishedByBook, readIds);
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <ReaderHeader sectionName="Мои книги" />
            <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
                <Link href="/" className="reader-link">← На главную</Link>
                <div className="mb-10 mt-10 max-w-2xl">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Библиотека
                    </p>
                    <h1 className="font-reader text-4xl tracking-tight sm:text-5xl">Мои книги</h1>
                </div>
                {sections.length === 0 ? (
                    <p className="border border-dashed border-border bg-background p-8 text-muted-foreground">
                        Вы ещё не прочитали ни одной главы.
                    </p>
                ) : (
                    <div className="space-y-12">
                        {sections.map((section) => (
                            <section key={section.sectionId}>
                                <h2 className="mb-6 font-reader text-2xl tracking-tight sm:text-3xl">
                                    {section.sectionName}
                                </h2>
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {section.books.map((book) => (
                                        <BookCard
                                            key={book.id}
                                            book={book}
                                            isCompleted={completedBookIds.has(book.id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
