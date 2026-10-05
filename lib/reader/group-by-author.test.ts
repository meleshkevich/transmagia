import { describe, it, expect } from "vitest";
import { groupBooksByAuthor, UNKNOWN_AUTHOR } from "./group-by-author";
import type { ReaderBook } from "./data";

function makeBook(overrides: { id: string; title: string; author?: string | null; authorSortOrder?: number }): ReaderBook {
    return {
        id: overrides.id,
        sectionId: "s1",
        sectionSlug: "translations",
        title: overrides.title,
        slug: overrides.id,
        author: overrides.author ?? null,
        authorSortOrder: overrides.authorSortOrder ?? 1,
        description: null,
        coverImageUrl: null,
        status: "published",
    };
}

describe("groupBooksByAuthor", () => {
    it("books with the same author appear in one group", () => {
        const books = [
            makeBook({ id: "1", title: "A", author: "Иванов" }),
            makeBook({ id: "2", title: "B", author: "Иванов" }),
        ];
        const groups = groupBooksByAuthor(books);
        expect(groups).toHaveLength(1);
        expect(groups[0].author).toBe("Иванов");
        expect(groups[0].books).toHaveLength(2);
    });

    it("different authors produce different groups", () => {
        const books = [
            makeBook({ id: "1", title: "A", author: "Иванов" }),
            makeBook({ id: "2", title: "B", author: "Петров" }),
        ];
        const groups = groupBooksByAuthor(books);
        expect(groups).toHaveLength(2);
        const authors = groups.map((g) => g.author);
        expect(authors).toContain("Иванов");
        expect(authors).toContain("Петров");
    });

    it("null author goes to «Автор не указан»", () => {
        const books = [makeBook({ id: "1", title: "A", author: null })];
        const groups = groupBooksByAuthor(books);
        expect(groups).toHaveLength(1);
        expect(groups[0].author).toBe(UNKNOWN_AUTHOR);
    });

    it("empty string author goes to «Автор не указан»", () => {
        const books = [makeBook({ id: "1", title: "A", author: "" })];
        const groups = groupBooksByAuthor(books);
        expect(groups).toHaveLength(1);
        expect(groups[0].author).toBe(UNKNOWN_AUTHOR);
    });

    it("whitespace-only author goes to «Автор не указан»", () => {
        const books = [makeBook({ id: "1", title: "A", author: "   " })];
        const groups = groupBooksByAuthor(books);
        expect(groups).toHaveLength(1);
        expect(groups[0].author).toBe(UNKNOWN_AUTHOR);
    });

    it("group order is alphabetical by author name (Russian locale)", () => {
        const books = [
            makeBook({ id: "1", title: "A", author: "Петров" }),
            makeBook({ id: "2", title: "B", author: "Иванов" }),
            makeBook({ id: "3", title: "C", author: "Алексеев" }),
        ];
        const groups = groupBooksByAuthor(books);
        const authors = groups.map((g) => g.author);
        expect(authors).toEqual(["Алексеев", "Иванов", "Петров"]);
    });

    it("«Автор не указан» group appears last", () => {
        const books = [
            makeBook({ id: "1", title: "A", author: null }),
            makeBook({ id: "2", title: "B", author: "Иванов" }),
        ];
        const groups = groupBooksByAuthor(books);
        expect(groups.at(-1)!.author).toBe(UNKNOWN_AUTHOR);
    });

    it("book ordering within each group is preserved", () => {
        const books = [
            makeBook({ id: "1", title: "First", author: "Иванов" }),
            makeBook({ id: "2", title: "Second", author: "Иванов" }),
            makeBook({ id: "3", title: "Third", author: "Иванов" }),
        ];
        const groups = groupBooksByAuthor(books);
        expect(groups[0].books.map((b) => b.id)).toEqual(["1", "2", "3"]);
    });

    it("no books are lost", () => {
        const books = [
            makeBook({ id: "1", title: "A", author: "Иванов" }),
            makeBook({ id: "2", title: "B", author: "Петров" }),
            makeBook({ id: "3", title: "C", author: null }),
            makeBook({ id: "4", title: "D", author: "Иванов" }),
        ];
        const groups = groupBooksByAuthor(books);
        const totalBooks = groups.reduce((sum, g) => sum + g.books.length, 0);
        expect(totalBooks).toBe(4);
    });

    it("no duplicate books: each book id appears exactly once", () => {
        const books = [
            makeBook({ id: "1", title: "A", author: "Иванов" }),
            makeBook({ id: "2", title: "B", author: "Иванов" }),
            makeBook({ id: "3", title: "C", author: "Петров" }),
        ];
        const groups = groupBooksByAuthor(books);
        const ids = groups.flatMap((g) => g.books.map((b) => b.id));
        expect(ids).toHaveLength(new Set(ids).size);
    });

    it("returns empty array when no books", () => {
        expect(groupBooksByAuthor([])).toEqual([]);
    });
});
