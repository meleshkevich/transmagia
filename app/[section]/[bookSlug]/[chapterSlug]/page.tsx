import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChapterNavigation } from "@/components/reader/chapter-navigation";
import { ReaderHeader } from "@/components/reader/reader-header";
import { ReaderSurface } from "@/components/reader/reader-surface";
import { SectionGate } from "@/components/reader/section-gate";
import { TiptapRenderer } from "@/components/reader/tiptap-renderer";
import { CommentsSection } from "@/components/comments/comments-section";
import { getChapterPageData, getPublishedChapterMetadata } from "@/lib/reader/data";
import { decodeParam } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ section: string; bookSlug: string; chapterSlug: string }> }): Promise<Metadata> {
    const { section, bookSlug, chapterSlug } = await params;
    const result = await getPublishedChapterMetadata(decodeParam(section), decodeParam(bookSlug), decodeParam(chapterSlug));
    if (!result) return {};
    return {
        title: `${result.chapter.title} — ${result.book.title}`,
        description: `Глава «${result.chapter.title}» книги «${result.book.title}».`,
    };
}

export default async function ChapterPage({ params }: { params: Promise<{ section: string; bookSlug: string; chapterSlug: string }> }) {
    const { section: rawSection, bookSlug: rawBookSlug, chapterSlug: rawChapterSlug } = await params;
    const sectionSlug = decodeParam(rawSection);
    const bookSlug = decodeParam(rawBookSlug);
    const chapterSlug = decodeParam(rawChapterSlug);
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

    const bookHref = `/${sectionSlug}/${bookSlug}`;

    return (
        <ReaderSurface>
            <ReaderHeader sectionName={result.section.name} bookTitle={result.book.title} />
            <main>
                <div className="mx-auto max-w-4xl px-5 pt-6 lg:px-8 lg:pt-10">
                    <Link href={bookHref} className="chapter-toc-link">← К оглавлению</Link>
                </div>
                <header className="mx-auto max-w-4xl px-5 pb-4 pt-5 lg:px-8">
                    <Link href={bookHref} className="chapter-toc-link">
                        {result.book.title}
                    </Link>
                    <h1 className="mt-3 font-reader text-4xl tracking-tight sm:text-5xl">{result.chapter.title}</h1>
                </header>
                <TiptapRenderer content={result.content ?? { type: "doc", content: [] }} />
                <CommentsSection chapterId={result.chapter.id} />
                <ChapterNavigation sectionSlug={sectionSlug} bookSlug={bookSlug} chapters={result.chapters} currentChapterId={result.chapter.id} />
            </main>
        </ReaderSurface>
    );
}
