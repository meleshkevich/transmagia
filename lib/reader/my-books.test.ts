import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin");

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getMyBooks } from "./my-books";

// ─── Constants ───────────────────────────────────────────────────────────────

const USER_ID = "user-0000-0000-0000-000000000001";
const BOOK_A = "aaaaaaaa-0000-4000-8000-000000000001";
const BOOK_B = "bbbbbbbb-0000-4000-8000-000000000002";
const BOOK_C = "cccccccc-0000-4000-8000-000000000003";
const SECTION_ORIGINALS = "sec-orig-0000-0000-000000000001";
const SECTION_TRANSLATIONS = "sec-tran-0000-0000-000000000002";

// ─── Mock helpers ─────────────────────────────────────────────────────────────

type QueryResult = { data: unknown[] | null; error: unknown };

/**
 * Creates a chain object that:
 * - Returns itself for all chaining methods (select, eq, in)
 * - Is awaitable via .then() returning the preset result
 * - Supports .range() for paginated queries (slices data)
 */
function makeQueryChain(result: QueryResult) {
    const chain: Record<string, unknown> = {
        then(
            resolve: (v: QueryResult) => unknown,
            reject?: (e: unknown) => unknown,
        ) {
            return Promise.resolve(result).then(resolve, reject);
        },
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        range: vi.fn((from: number, to: number) =>
            Promise.resolve({
                data: result.error ? null : (result.data ?? []).slice(from, to + 1),
                error: result.error,
            }),
        ),
    };
    return chain;
}

interface TableResults {
    chapter_read_progress?: QueryResult;
    books?: QueryResult;
    sections?: QueryResult;
}

function makeMockClient(tables: TableResults = {}) {
    const fromMock = vi.fn((table: string) => {
        const result = tables[table as keyof TableResults] ?? { data: [], error: null };
        return makeQueryChain(result);
    });

    const storageMock = {
        from: vi.fn(() => ({
            getPublicUrl: vi.fn((path: string) => ({
                data: { publicUrl: `https://cdn.example.com/${path}` },
            })),
        })),
    };

    return { from: fromMock, storage: storageMock };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeProgressRows(bookIds: string[]) {
    return bookIds.map((book_id) => ({ chapters: { book_id } }));
}

const sectionOriginalsRow = { id: SECTION_ORIGINALS, name: "Оригинальные новеллы", slug: "originals" };
const sectionTranslationsRow = { id: SECTION_TRANSLATIONS, name: "Переводы", slug: "translations" };

const bookARow = {
    id: BOOK_A,
    section_id: SECTION_ORIGINALS,
    title: "Книга A",
    slug: "book-a",
    author: "Автор A",
    author_sort_order: 1,
    description: null,
    cover_image_path: null,
    status: "published",
};

const bookBRow = {
    id: BOOK_B,
    section_id: SECTION_TRANSLATIONS,
    title: "Книга B",
    slug: "book-b",
    author: "Автор B",
    author_sort_order: 1,
    description: null,
    cover_image_path: null,
    status: "ongoing",
};

const bookCRow = {
    id: BOOK_C,
    section_id: SECTION_ORIGINALS,
    title: "Книга C",
    slug: "book-c",
    author: null,
    author_sort_order: 2,
    description: null,
    cover_image_path: null,
    status: "published",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("getMyBooks", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    // 1. No read progress → empty result
    it("returns empty array when user has no read progress", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({ chapter_read_progress: { data: [], error: null } }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result).toEqual([]);
    });

    // 2. Progress exists but all matching books are draft (filtered out by status query)
    it("returns empty array when all read books have status draft", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: { data: makeProgressRows([BOOK_A]), error: null },
                books: { data: [], error: null }, // admin DB returned no ongoing/published books
                sections: { data: [], error: null },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result).toEqual([]);
    });

    // 3. Draft books excluded — only ongoing and published are returned
    it("only includes books with ongoing or published status", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: { data: makeProgressRows([BOOK_A]), error: null },
                books: { data: [bookARow], error: null },
                sections: { data: [sectionOriginalsRow], error: null },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result).toHaveLength(1);
        expect(result[0].books).toHaveLength(1);
        expect(result[0].books[0].id).toBe(BOOK_A);
    });

    // 4. Ongoing books are included
    it("includes books with status ongoing", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: { data: makeProgressRows([BOOK_B]), error: null },
                books: { data: [bookBRow], error: null },
                sections: { data: [sectionTranslationsRow], error: null },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result[0].books[0].status).toBe("ongoing");
    });

    // 5. Published books are included
    it("includes books with status published", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: { data: makeProgressRows([BOOK_A]), error: null },
                books: { data: [bookARow], error: null },
                sections: { data: [sectionOriginalsRow], error: null },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result[0].books[0].status).toBe("published");
    });

    // 6. Section order: originals → fanfiction → translations
    it("returns sections in canonical order: originals before translations", async () => {
        // DB returns translations first, then originals — order must be corrected
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: {
                    data: makeProgressRows([BOOK_B, BOOK_A]),
                    error: null,
                },
                books: { data: [bookBRow, bookARow], error: null },
                sections: { data: [sectionTranslationsRow, sectionOriginalsRow], error: null },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result).toHaveLength(2);
        expect(result[0].sectionSlug).toBe("originals");
        expect(result[1].sectionSlug).toBe("translations");
    });

    // 7. Translation books appear without section cookie access
    it("returns translation books without any access cookie check", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: { data: makeProgressRows([BOOK_B]), error: null },
                books: { data: [bookBRow], error: null },
                sections: { data: [sectionTranslationsRow], error: null },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result).toHaveLength(1);
        expect(result[0].sectionSlug).toBe("translations");
        expect(result[0].books[0].id).toBe(BOOK_B);
    });

    // 8. Sections with no qualifying books are omitted
    it("omits sections that have no qualifying books", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: { data: makeProgressRows([BOOK_A]), error: null },
                books: { data: [bookARow], error: null },
                sections: { data: [sectionOriginalsRow], error: null },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result.every((s) => s.books.length > 0)).toBe(true);
        expect(result.find((s) => s.sectionSlug === "translations")).toBeUndefined();
    });

    // 9. Cover URL resolved via Supabase Storage when path is set
    it("resolves cover image URL when cover_image_path is set", async () => {
        const bookWithCover = { ...bookARow, cover_image_path: "covers/book-a.jpg" };
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: { data: makeProgressRows([BOOK_A]), error: null },
                books: { data: [bookWithCover], error: null },
                sections: { data: [sectionOriginalsRow], error: null },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result[0].books[0].coverImageUrl).toBe("https://cdn.example.com/covers/book-a.jpg");
    });

    // 10. Cover URL is null when path is absent
    it("sets coverImageUrl to null when cover_image_path is null", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: { data: makeProgressRows([BOOK_A]), error: null },
                books: { data: [bookARow], error: null }, // cover_image_path: null
                sections: { data: [sectionOriginalsRow], error: null },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result[0].books[0].coverImageUrl).toBeNull();
    });

    // 11. Books from multiple sections appear in separate section entries
    it("groups books from multiple sections into separate section entries", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: {
                    data: makeProgressRows([BOOK_A, BOOK_B]),
                    error: null,
                },
                books: { data: [bookARow, bookBRow], error: null },
                sections: { data: [sectionOriginalsRow, sectionTranslationsRow], error: null },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result).toHaveLength(2);
        const originals = result.find((s) => s.sectionSlug === "originals");
        const translations = result.find((s) => s.sectionSlug === "translations");
        expect(originals?.books).toHaveLength(1);
        expect(translations?.books).toHaveLength(1);
    });

    // 12. Duplicate progress rows for same book → book appears once
    it("deduplicates book IDs from multiple progress rows for the same book", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: {
                    // Same BOOK_A appears in three progress rows (different chapters)
                    data: makeProgressRows([BOOK_A, BOOK_A, BOOK_A]),
                    error: null,
                },
                books: { data: [bookARow], error: null },
                sections: { data: [sectionOriginalsRow], error: null },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result[0].books).toHaveLength(1);
    });

    // 13. Two books in the same section both appear
    it("includes multiple books from the same section", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: {
                    data: makeProgressRows([BOOK_A, BOOK_C]),
                    error: null,
                },
                books: { data: [bookARow, bookCRow], error: null },
                sections: { data: [sectionOriginalsRow], error: null },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getMyBooks(USER_ID);
        expect(result).toHaveLength(1);
        expect(result[0].books).toHaveLength(2);
    });

    // 14. Throws on chapter_read_progress query error
    it("throws on chapter_read_progress query error", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: { data: null, error: new Error("db error") },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        await expect(getMyBooks(USER_ID)).rejects.toThrow("Не удалось получить прогресс чтения.");
    });

    // ... and on books query error
    it("throws on books query error", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            makeMockClient({
                chapter_read_progress: { data: makeProgressRows([BOOK_A]), error: null },
                books: { data: null, error: new Error("db error") },
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        await expect(getMyBooks(USER_ID)).rejects.toThrow("Не удалось получить книги.");
    });
});
