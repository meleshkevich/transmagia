import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReaderHeader } from "@/components/reader/reader-header";
import { getPublishedBook, getPublishedChapters } from "@/lib/reader/data";

export async function generateMetadata({ params }: { params: Promise<{ section: string; bookSlug: string }> }): Promise<Metadata> {
    const { section, bookSlug } = await params;
    const result = await getPublishedBook(section, bookSlug);
    if (!result) return {};
    return {
        title: result.book.title,
        description: result.book.description ?? `Книга «${result.book.title}» на Трансмагии.`,
    };
}

export default async function BookPage({ params }: { params: Promise<{ section: string; bookSlug: string }> }) {
    const { section: sectionSlug, bookSlug } = await params;
    const result = await getPublishedBook(sectionSlug, bookSlug);
    if (!result) notFound();

    const chapters = await getPublishedChapters(result.book.id);

    return (
        <div className="min-h-screen bg-muted/40">
            <ReaderHeader sectionName={result.section.name} bookTitle={result.book.title} />
            <main className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-16">
                <Link href={`/${sectionSlug}`} className="reader-link">← К разделу</Link>
                <section className="mt-8 grid gap-8 md:grid-cols-[12rem_1fr]">
                    {result.book.coverImageUrl ? (
                        <img className="aspect-[2/3] w-full object-cover" src={result.book.coverImageUrl} alt={`Обложка книги «${result.book.title}»`} />
                    ) : <div className="grid aspect-[2/3] place-items-center bg-accent font-reader text-5xl text-accent-foreground">Т</div>}
                    <div>
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Книга</p>
                        <h1 className="font-reader text-4xl tracking-tight sm:text-5xl">{result.book.title}</h1>
                        {result.book.author && <p className="mt-3 text-lg text-muted-foreground">{result.book.author}</p>}
                        {result.book.description && <p className="mt-6 max-w-2xl leading-8 text-muted-foreground">{result.book.description}</p>}
                        {result.section.isProtected && <p className="mt-6 text-sm font-semibold text-amber-800">Раздел доступен после проверки пароля или входа.</p>}
                    </div>
                </section>
                <section className="mt-14">
                    <h2 className="font-reader text-3xl tracking-tight">Главы</h2>
                    {chapters.length > 0 ? (
                        <ol className="mt-5 divide-y divide-border border-y border-border">
                            {chapters.map((chapter) => (
                                <li key={chapter.id}>
                                    <Link className="flex items-center justify-between gap-4 py-4 hover:bg-background/70" href={`/${sectionSlug}/${bookSlug}/${chapter.slug}`}>
                                        <span><span className="mr-3 text-sm text-muted-foreground">{chapter.sortOrder}.</span>{chapter.title}</span>
                                        <span className="text-sm text-muted-foreground">Читать →</span>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="mt-5 text-muted-foreground">Опубликованных глав пока нет.</p>}
                </section>
            </main>
        </div>
    );
}
