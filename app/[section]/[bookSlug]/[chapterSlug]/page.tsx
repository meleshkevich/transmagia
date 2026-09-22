import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChapterNavigation } from "@/components/reader/chapter-navigation";
import { ReaderHeader } from "@/components/reader/reader-header";
import { ReaderSurface } from "@/components/reader/reader-surface";
import { SectionGate } from "@/components/reader/section-gate";
import { TiptapRenderer } from "@/components/reader/tiptap-renderer";
import { getChapterPageData, getPublishedChapterMetadata } from "@/lib/reader/data";

export async function generateMetadata({ params }: { params: Promise<{ section: string; bookSlug: string; chapterSlug: string }> }): Promise<Metadata> {
    const { section, bookSlug, chapterSlug } = await params;
    const result = await getPublishedChapterMetadata(section, bookSlug, chapterSlug);
    if (!result) return {};
    return {
        title: `${result.chapter.title} — ${result.book.title}`,
        description: `Глава «${result.chapter.title}» книги «${result.book.title}».`,
    };
}

export default async function ChapterPage({ params }: { params: Promise<{ section: string; bookSlug: string; chapterSlug: string }> }) {
    const { section: sectionSlug, bookSlug, chapterSlug } = await params;
    const result = await getChapterPageData(sectionSlug, bookSlug, chapterSlug);
    if (!result) notFound();

    const redirectTo = `/${sectionSlug}/${bookSlug}/${chapterSlug}`;

    if (!result.canRead) {
        return (
            <div className="min-h-screen bg-muted/40">
                <ReaderHeader sectionName={result.section.name} bookTitle={result.book.title} />
                <main className="px-5 py-20">
                    <SectionGate sectionId={result.section.id} redirectTo={redirectTo} />
                </main>
            </div>
        );
    }

    return (
        <ReaderSurface>
            <ReaderHeader sectionName={result.section.name} bookTitle={result.book.title} />
            <main>
                <header className="mx-auto max-w-4xl px-5 pb-4 pt-10 lg:px-8 lg:pt-16">
                    <p className="text-sm text-muted-foreground">{result.book.title}</p>
                    <h1 className="mt-3 font-reader text-4xl tracking-tight sm:text-5xl">{result.chapter.title}</h1>
                </header>
                <TiptapRenderer content={result.content ?? { type: "doc", content: [] }} />
                <section aria-label="Комментарии" className="mx-auto max-w-4xl border-t border-border/70 px-5 py-8 text-sm text-muted-foreground lg:px-8">
                    Комментарии появятся в следующей фазе.
                </section>
                <ChapterNavigation sectionSlug={sectionSlug} bookSlug={bookSlug} chapters={result.chapters} currentChapterId={result.chapter.id} />
            </main>
        </ReaderSurface>
    );
}
