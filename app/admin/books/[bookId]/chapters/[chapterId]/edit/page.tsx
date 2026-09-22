import Link from "next/link";
import { notFound } from "next/navigation";

import { updateChapterAction, uploadContentImageAction } from "@/app/actions/cms";
import { ChapterForm } from "@/components/admin/chapter-form";
import { getAdminBook, getAdminChapter } from "@/lib/admin/data";

export default async function EditChapterPage({ params }: { params: Promise<{ bookId: string; chapterId: string }> }) {
    const { bookId, chapterId } = await params;
    const [book, result] = await Promise.all([getAdminBook(bookId), getAdminChapter(chapterId)]);
    if (!book || !result || result.chapter.bookId !== bookId) notFound();
    return <section className="admin-narrow-page"><Link href={`/admin/books/${bookId}`} className="admin-back-link">← К книге</Link><div className="admin-page-heading"><div><p className="admin-eyebrow">{book.title}</p><h1>Редактировать главу</h1></div><Link href={`/admin/books/${bookId}/chapters/${chapterId}/preview`} className="admin-secondary-button">Предпросмотр</Link></div><ChapterForm bookId={bookId} chapter={result.chapter} initialContent={result.content} action={updateChapterAction.bind(null, chapterId)} uploadImage={uploadContentImageAction.bind(null, bookId)} /></section>;
}
