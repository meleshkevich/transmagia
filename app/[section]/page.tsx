import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BookCard } from "@/components/reader/book-card";
import { BooksByAuthor } from "@/components/reader/books-by-author";
import { ReaderHeader } from "@/components/reader/reader-header";
import { SectionGate } from "@/components/reader/section-gate";
import { TranslationsSearch } from "@/components/reader/translations-search";
import { getCurrentProfile } from "@/lib/auth/server";
import { canReadSection } from "@/lib/auth/access";
import { isCatalogRestricted } from "@/lib/auth/access-policy";
import { filterBooksByQuery } from "@/lib/reader/filter-books";
import { getPublishedBooks, getReaderSection } from "@/lib/reader/data";

const GROUPED_SECTIONS = new Set(["translations"]);

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
    const { section: slug } = await params;
    const section = await getReaderSection(slug);
    return section ? { title: section.name, description: section.description ?? `Каталог раздела «${section.name}».` } : {};
}

export default async function SectionPage({
    params,
    searchParams,
}: {
    params: Promise<{ section: string }>;
    searchParams: Promise<{ q?: string | string[] }>;
}) {
    const [{ section: slug }, rawParams] = await Promise.all([params, searchParams]);
    const section = await getReaderSection(slug);
    if (!section) notFound();

    const isGrouped = GROUPED_SECTIONS.has(slug);

    if (isCatalogRestricted(slug, section.isProtected)) {
        const profile = await getCurrentProfile();
        if (!profile) {
            redirect(`/login?next=/${encodeURIComponent(slug)}`);
        }
        const canRead = await canReadSection(section.id);
        if (!canRead) {
            return (
                <div className="min-h-screen bg-muted/40">
                    <ReaderHeader sectionName={section.name} />
                    <main className="px-5 py-20">
                        <SectionGate sectionId={section.id} redirectTo={`/${slug}`} />
                    </main>
                </div>
            );
        }
    }

    const books = await getPublishedBooks(slug);

    // Search only applies to grouped sections (translations). If we reach this
    // point for a restricted section, access is already verified above.
    const searchQuery = isGrouped
        ? (typeof rawParams.q === "string" ? rawParams.q.trim() : "")
        : "";

    const displayBooks = filterBooksByQuery(books, searchQuery);

    // Passed as a prop to keep ReaderHeader a server component while embedding a
    // client search form inside it via React's server→client composition pattern.
    const searchSlot = isGrouped ? (
        <TranslationsSearch sectionSlug={slug} currentQuery={searchQuery} />
    ) : undefined;

    return (
        <div className="min-h-screen bg-muted/40">
            <ReaderHeader sectionName={section.name} searchSlot={searchSlot} />
            <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
                <div className="mb-10 max-w-2xl">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Каталог</p>
                    <h1 className="font-reader text-4xl tracking-tight sm:text-5xl">{section.name}</h1>
                    {section.description && <p className="mt-4 text-lg leading-8 text-muted-foreground">{section.description}</p>}
                </div>
                {displayBooks.length > 0 ? (
                    isGrouped ? (
                        <BooksByAuthor books={displayBooks} />
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">{displayBooks.map((book) => <BookCard key={book.id} book={book} />)}</div>
                    )
                ) : searchQuery ? (
                    <p className="border border-dashed border-border bg-background p-8 text-muted-foreground">Ничего не найдено.</p>
                ) : (
                    <p className="border border-dashed border-border bg-background p-8 text-muted-foreground">В этом разделе пока нет опубликованных книг.</p>
                )}
            </main>
        </div>
    );
}
