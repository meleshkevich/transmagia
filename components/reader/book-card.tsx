import Link from "next/link";

import type { ReaderBook } from "@/lib/reader/data";
import { BOOK_CARD_DESCRIPTION_LIMIT } from "@/lib/reader/config";
import { extractTiptapText, truncateDescription } from "@/lib/tiptap-text";

export function BookCard({ book }: { book: ReaderBook }) {
    const descriptionPreview = book.description
        ? truncateDescription(extractTiptapText(book.description), BOOK_CARD_DESCRIPTION_LIMIT)
        : null;

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
                {descriptionPreview && <p className="book-description">{descriptionPreview}</p>}
                <Link className="reader-link" href={`/${book.sectionSlug}/${book.slug}`}>Открыть книгу</Link>
            </div>
        </article>
    );
}
