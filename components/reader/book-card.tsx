import Link from "next/link";
import { Check } from "lucide-react";

import type { ReaderBook } from "@/lib/reader/data";
import { BOOK_CARD_DESCRIPTION_LIMIT } from "@/lib/reader/config";
import { extractTiptapText, truncateDescription } from "@/lib/tiptap-text";

type Props = {
    book: ReaderBook;
    isCompleted?: boolean;
};

export function BookCard({ book, isCompleted = false }: Props) {
    const descriptionPreview = book.description
        ? truncateDescription(extractTiptapText(book.description), BOOK_CARD_DESCRIPTION_LIMIT)
        : null;

    return (
        <Link href={`/${book.sectionSlug}/${book.slug}`} className="book-card-link">
            <article className="book-card">
                {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt={`Обложка книги «${book.title}»`} loading="lazy" />
                ) : (
                    <div className="book-card-placeholder" aria-hidden="true">Т</div>
                )}
                <div className="book-card-body">
                    {book.status === "ongoing" && <span className="book-ongoing-badge">В работе</span>}
                    <h2>
                        {isCompleted && (
                            <Check
                                size={16}
                                strokeWidth={2.5}
                                className="book-completion-icon"
                                aria-label="Все главы прочитаны"
                            />
                        )}
                        {book.title}
                    </h2>
                    {book.author && <p className="book-author">{book.author}</p>}
                    {descriptionPreview && <p className="book-description">{descriptionPreview}</p>}
                    <span className="reader-link">Открыть книгу</span>
                </div>
            </article>
        </Link>
    );
}
