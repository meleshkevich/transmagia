import type { ReaderBook } from "./data";

export function filterBooksByQuery(books: ReaderBook[], query: string): ReaderBook[] {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
        (book) =>
            book.title.toLowerCase().includes(q) ||
            (book.author?.toLowerCase().includes(q) ?? false),
    );
}
