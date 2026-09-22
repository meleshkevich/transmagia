import Link from "next/link";

import type { ReaderChapterSummary } from "@/lib/reader/data";

export function ChapterNavigation({
    sectionSlug,
    bookSlug,
    chapters,
    currentChapterId,
}: {
    sectionSlug: string;
    bookSlug: string;
    chapters: ReaderChapterSummary[];
    currentChapterId: string;
}) {
    const currentIndex = chapters.findIndex((chapter) => chapter.id === currentChapterId);
    const previous = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    const next = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
    const bookHref = `/${sectionSlug}/${bookSlug}`;

    return (
        <nav className="mx-auto flex max-w-4xl flex-col gap-3 border-t border-border/70 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8" aria-label="Навигация по главам">
            {previous ? (
                <Link className="reader-link" href={`/${sectionSlug}/${bookSlug}/${previous.slug}`}>← {previous.title}</Link>
            ) : <span className="text-sm text-muted-foreground">Начало книги</span>}
            <Link className="reader-link text-center" href={bookHref}>К книге</Link>
            {next ? (
                <Link className="reader-link text-right" href={`/${sectionSlug}/${bookSlug}/${next.slug}`}>{next.title} →</Link>
            ) : <span className="text-right text-sm text-muted-foreground">Конец книги</span>}
        </nav>
    );
}
