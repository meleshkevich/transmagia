import Link from "next/link";
import { notFound } from "next/navigation";

import { updateBookAction } from "@/app/actions/cms";
import { BookForm } from "@/components/admin/book-form";
import { ChapterReorder } from "@/components/admin/chapter-reorder";
import { getAdminBook, getAdminChapters, getAdminSections } from "@/lib/admin/data";

export default async function AdminBookPage({ params }: { params: Promise<{ bookId: string }> }) {
    const { bookId } = await params;
    const [book, sections, chapters] = await Promise.all([getAdminBook(bookId), getAdminSections(), getAdminChapters(bookId)]);
    if (!book) notFound();
    return <section><Link href="/admin/books" className="admin-back-link">← К книгам</Link><div className="admin-page-heading"><div><p className="admin-eyebrow">Книга</p><h1>{book.title}</h1></div><Link href={`/admin/books/${bookId}/chapters/new`} className="admin-primary-button">Добавить главу</Link></div><div className="admin-book-layout"><div className="admin-panel"><h2>Информация о книге</h2><BookForm sections={sections} book={book} action={updateBookAction.bind(null, bookId)} submitLabel="Сохранить книгу" /></div><div className="admin-panel"><div className="admin-panel-heading"><div><h2>Главы</h2><p className="admin-muted">{chapters.length} глав</p></div><Link href={`/admin/books/${bookId}/chapters/new`} className="admin-secondary-button">Добавить</Link></div>{chapters.length ? <ChapterReorder bookId={bookId} chapters={chapters} /> : <p className="admin-empty">Глав пока нет.</p>}</div></div></section>;
}
