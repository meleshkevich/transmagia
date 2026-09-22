import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookCard } from "@/components/reader/book-card";
import { ReaderHeader } from "@/components/reader/reader-header";
import { getPublishedBooks, getReaderSection } from "@/lib/reader/data";

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
    const { section: slug } = await params;
    const section = await getReaderSection(slug);
    return section ? { title: section.name, description: section.description ?? `Каталог раздела «${section.name}».` } : {};
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
    const { section: slug } = await params;
    const section = await getReaderSection(slug);
    if (!section) notFound();

    const books = await getPublishedBooks(slug);

    return (
        <div className="min-h-screen bg-muted/40">
            <ReaderHeader sectionName={section.name} />
            <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
                <div className="mb-10 max-w-2xl">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Каталог</p>
                    <h1 className="font-reader text-4xl tracking-tight sm:text-5xl">{section.name}</h1>
                    {section.description && <p className="mt-4 text-lg leading-8 text-muted-foreground">{section.description}</p>}
                </div>
                {books.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">{books.map((book) => <BookCard key={book.id} book={book} />)}</div>
                ) : (
                    <p className="border border-dashed border-border bg-background p-8 text-muted-foreground">В этом разделе пока нет опубликованных книг.</p>
                )}
            </main>
        </div>
    );
}
