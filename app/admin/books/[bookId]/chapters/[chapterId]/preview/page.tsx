import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ChapterNavigation } from "@/components/reader/chapter-navigation";
import { ReaderSurface } from "@/components/reader/reader-surface";
import { TiptapRenderer } from "@/components/reader/tiptap-renderer";
import { getAdminBook, getAdminChapter, getAdminChapters } from "@/lib/admin/data";

export const metadata: Metadata = {
    title: "Предпросмотр главы",
    robots: { index: false, follow: false },
};

export default async function ChapterPreviewPage({ params }: { params: Promise<{ bookId: string; chapterId: string }> }) {
    const { bookId, chapterId } = await params;
    const [book, result, chapters] = await Promise.all([getAdminBook(bookId), getAdminChapter(chapterId), getAdminChapters(bookId)]);
    if (!book || !result || result.chapter.bookId !== bookId) notFound();

    return <ReaderSurface><div className="mx-auto flex max-w-4xl justify-between px-5 pt-5 lg:px-8"><span className="admin-status admin-status-draft">Предпросмотр для администратора</span><Link href={`/admin/books/${bookId}/chapters/${chapterId}/edit`} className="reader-link">← К редактированию</Link></div><main><header className="mx-auto max-w-4xl px-5 pb-4 pt-10 lg:px-8 lg:pt-16"><p className="text-sm text-muted-foreground">{book.title}</p><h1 className="mt-3 font-reader text-4xl tracking-tight sm:text-5xl">{result.chapter.title}</h1></header><TiptapRenderer content={result.content} /><ChapterNavigation sectionSlug={book.sectionSlug} bookSlug={book.slug} chapters={chapters} currentChapterId={chapterId} /></main></ReaderSurface>;
}
