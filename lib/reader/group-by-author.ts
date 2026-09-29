import type { ReaderBook } from "./data";

export const UNKNOWN_AUTHOR = "Автор не указан";

export type AuthorGroup = {
    author: string;
    books: ReaderBook[];
};

export function groupBooksByAuthor(books: ReaderBook[]): AuthorGroup[] {
    const map = new Map<string, ReaderBook[]>();
    const unknown: ReaderBook[] = [];

    for (const book of books) {
        const author = book.author?.trim() ?? "";
        if (!author) {
            unknown.push(book);
        } else {
            const group = map.get(author);
            if (group) {
                group.push(book);
            } else {
                map.set(author, [book]);
            }
        }
    }

    const sorted: AuthorGroup[] = [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b, "ru"))
        .map(([author, books]) => ({ author, books }));

    if (unknown.length > 0) {
        sorted.push({ author: UNKNOWN_AUTHOR, books: unknown });
    }

    return sorted;
}
