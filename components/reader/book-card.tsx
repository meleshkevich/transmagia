import Link from "next/link";

import type { ReaderBook } from "@/lib/reader/data";

export function BookCard({ book }: { book: ReaderBook }) {
    return (
        <article className="book-card">
            {book.coverImageUrl ? (
                <img src={book.coverImageUrl} alt={`Обложка книги «${book.title}»`} loading="lazy" />
            ) : (
                <div className="book-card-placeholder" aria-hidden="true">Т</div>
            )}
            <div className="book-card-body">
                <h2><Link href={`/${book.sectionSlug}/${book.slug}`}>{book.title}</Link></h2>
                {book.author && <p className="book-author">{book.author}</p>}
                {book.description && <p className="book-description">{book.description}</p>}
                <Link className="reader-link" href={`/${book.sectionSlug}/${book.slug}`}>Открыть книгу</Link>
            </div>
        </article>
    );
}
