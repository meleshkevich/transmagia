import Link from "next/link";
import { notFound } from "next/navigation";

import { createChapterAction, uploadContentImageAction } from "@/app/actions/cms";
import { ChapterForm } from "@/components/admin/chapter-form";
import { getAdminBook } from "@/lib/admin/data";

export default async function NewChapterPage({ params }: { params: Promise<{ bookId: string }> }) {
    const { bookId } = await params;
    const book = await getAdminBook(bookId);
    if (!book) notFound();
    const initialContent = { type: "doc", content: [{ type: "paragraph" }] };
    return <section className="admin-narrow-page"><Link href={`/admin/books/${bookId}`} className="admin-back-link">← К книге</Link><div className="admin-page-heading"><div><p className="admin-eyebrow">{book.title}</p><h1>Новая глава</h1></div></div><ChapterForm bookId={bookId} initialContent={initialContent} action={createChapterAction.bind(null, bookId)} uploadImage={uploadContentImageAction.bind(null, bookId)} /></section>;
}
