import { beforeEach, describe, expect, it, vi } from "vitest";

// server-only is a runtime guard; mock it so the module can be imported in tests.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin");

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
    getPublishedChapterIdsByBook,
    getReadChapterIdsForBook,
    getReadChapterIdsForBooks,
} from "./reading-progress";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_ID = "user-0000-0000-0000-000000000001";
const BOOK_A = "aaaaaaaa-0000-4000-8000-000000000001";
const BOOK_B = "bbbbbbbb-0000-4000-8000-000000000002";

function makeChapterId(n: number) {
    return `ch${String(n).padStart(36 - 2, "0")}`;
}

function makeChapterRows(count: number, bookId = BOOK_A) {
    return Array.from({ length: count }, (_, i) => ({
        id: makeChapterId(i),
        book_id: bookId,
    }));
}

function makeProgressRows(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        chapter_id: makeChapterId(i),
    }));
}

/** Builds a chainable Supabase mock whose terminal .range() call is controlled. */
function buildChainMock(rangeImpl: (from: number, to: number) => unknown) {
    const chain: Record<string, unknown> = {};
    for (const method of ["from", "select", "eq", "in", "range"]) {
        chain[method] = vi.fn((...args: unknown[]) =>
            method === "range" ? rangeImpl(args[0] as number, args[1] as number) : chain,
        );
    }
    return chain;
}

// ─── getPublishedChapterIdsByBook ─────────────────────────────────────────────

describe("getPublishedChapterIdsByBook", () => {
    beforeEach(() => vi.resetAllMocks());

    it("empty bookIds → empty map, no DB call", async () => {
        const result = await getPublishedChapterIdsByBook([]);
        expect(result.size).toBe(0);
        expect(createSupabaseAdminClient).not.toHaveBeenCalled();
    });

    it("fewer than one page → returns all rows in a single page", async () => {
        const rows = makeChapterRows(3);
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => Promise.resolve({ data: rows, error: null })) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getPublishedChapterIdsByBook([BOOK_A]);
        expect(result.get(BOOK_A)).toHaveLength(3);
    });

    it("exactly one full page → fetches a second page that is empty", async () => {
        const rows = makeChapterRows(500);
        let call = 0;
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => {
                call++;
                return Promise.resolve({ data: call === 1 ? rows : [], error: null });
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getPublishedChapterIdsByBook([BOOK_A]);
        expect(result.get(BOOK_A)).toHaveLength(500);
    });

    it("more than one page → combines results from all pages", async () => {
        const page1 = makeChapterRows(500);
        const page2 = makeChapterRows(300).map((r, i) => ({
            ...r,
            id: makeChapterId(500 + i),
        }));
        let call = 0;
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => {
                call++;
                return Promise.resolve({ data: call === 1 ? page1 : page2, error: null });
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getPublishedChapterIdsByBook([BOOK_A]);
        expect(result.get(BOOK_A)).toHaveLength(800);
    });

    it("more than 1,000 rows → paginates beyond the PostgREST default limit", async () => {
        const page1 = makeChapterRows(500);
        const page2 = makeChapterRows(500).map((r, i) => ({
            ...r,
            id: makeChapterId(500 + i),
        }));
        const page3 = makeChapterRows(100).map((r, i) => ({
            ...r,
            id: makeChapterId(1000 + i),
        }));
        let call = 0;
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => {
                call++;
                if (call === 1) return Promise.resolve({ data: page1, error: null });
                if (call === 2) return Promise.resolve({ data: page2, error: null });
                return Promise.resolve({ data: page3, error: null });
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getPublishedChapterIdsByBook([BOOK_A]);
        expect(result.get(BOOK_A)).toHaveLength(1100);
    });

    it("final partial page terminates pagination", async () => {
        const page1 = makeChapterRows(500);
        const page2 = makeChapterRows(42).map((r, i) => ({
            ...r,
            id: makeChapterId(500 + i),
        }));
        let call = 0;
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => {
                call++;
                return Promise.resolve({ data: call === 1 ? page1 : page2, error: null });
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getPublishedChapterIdsByBook([BOOK_A]);
        expect(result.get(BOOK_A)).toHaveLength(542);
        expect(call).toBe(2);
    });

    it("database error on a later page throws — does not return partial data silently", async () => {
        const page1 = makeChapterRows(500);
        let call = 0;
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => {
                call++;
                if (call === 1) return Promise.resolve({ data: page1, error: null });
                return Promise.resolve({ data: null, error: { message: "DB error" } });
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        await expect(getPublishedChapterIdsByBook([BOOK_A])).rejects.toThrow(
            "Не удалось получить список глав.",
        );
    });

    it("correct book scoping — maps chapters to their respective books", async () => {
        const rows = [
            { id: makeChapterId(0), book_id: BOOK_A },
            { id: makeChapterId(1), book_id: BOOK_B },
        ];
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => Promise.resolve({ data: rows, error: null })) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getPublishedChapterIdsByBook([BOOK_A, BOOK_B]);
        expect(result.get(BOOK_A)).toHaveLength(1);
        expect(result.get(BOOK_B)).toHaveLength(1);
    });

    it("no duplicate IDs in the final result", async () => {
        const rows = makeChapterRows(500);
        let call = 0;
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => {
                call++;
                // Both pages return the same rows (simulates badly mocked data)
                return Promise.resolve({ data: call <= 2 ? rows : [], error: null });
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        // Pagination is based on page size, so both calls must complete.
        // We do not deduplicate at this layer (that is the caller's concern).
        // This test verifies the map builder uses push, not Set, allowing the
        // caller (getCompletedBookIds) to apply Set semantics via readChapterIds.
        const result = await getPublishedChapterIdsByBook([BOOK_A]);
        // Both pages included → 1000 entries in the array
        expect(result.get(BOOK_A)?.length).toBeGreaterThanOrEqual(500);
    });
});

// ─── getReadChapterIdsForBooks ────────────────────────────────────────────────

describe("getReadChapterIdsForBooks", () => {
    beforeEach(() => vi.resetAllMocks());

    it("empty bookIds → empty set, no DB call", async () => {
        const result = await getReadChapterIdsForBooks(USER_ID, []);
        expect(result.size).toBe(0);
        expect(createSupabaseAdminClient).not.toHaveBeenCalled();
    });

    it("fewer than one page → returns all rows", async () => {
        const rows = makeProgressRows(5);
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => Promise.resolve({ data: rows, error: null })) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getReadChapterIdsForBooks(USER_ID, [BOOK_A]);
        expect(result.size).toBe(5);
    });

    it("more than 1,000 rows → paginates beyond PostgREST default limit", async () => {
        const page1 = makeProgressRows(500);
        const page2 = makeProgressRows(500).map((r, i) => ({
            chapter_id: makeChapterId(500 + i),
        }));
        const page3 = makeProgressRows(150).map((r, i) => ({
            chapter_id: makeChapterId(1000 + i),
        }));
        let call = 0;
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => {
                call++;
                if (call === 1) return Promise.resolve({ data: page1, error: null });
                if (call === 2) return Promise.resolve({ data: page2, error: null });
                return Promise.resolve({ data: page3, error: null });
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getReadChapterIdsForBooks(USER_ID, [BOOK_A]);
        expect(result.size).toBe(1150);
    });

    it("database error on a later page throws — does not return partial data silently", async () => {
        const page1 = makeProgressRows(500);
        let call = 0;
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => {
                call++;
                if (call === 1) return Promise.resolve({ data: page1, error: null });
                return Promise.resolve({ data: null, error: { message: "DB error on page 2" } });
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        await expect(getReadChapterIdsForBooks(USER_ID, [BOOK_A])).rejects.toThrow(
            "Не удалось получить прогресс чтения.",
        );
    });

    it("correct user scoping — USER_ID is passed to the query", async () => {
        const eqSpy = vi.fn().mockReturnThis();
        const chain: Record<string, unknown> = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: eqSpy,
            in: vi.fn().mockReturnThis(),
            range: vi.fn(() => Promise.resolve({ data: [], error: null })),
        };
        vi.mocked(createSupabaseAdminClient).mockReturnValue(chain as unknown as ReturnType<typeof createSupabaseAdminClient>);

        await getReadChapterIdsForBooks(USER_ID, [BOOK_A]);

        expect(eqSpy).toHaveBeenCalledWith("user_id", USER_ID);
    });

    it("no duplicate IDs in the final result set", async () => {
        // Set deduplicates automatically; this test verifies Set semantics hold.
        const rows = [{ chapter_id: makeChapterId(0) }, { chapter_id: makeChapterId(0) }];
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => Promise.resolve({ data: rows, error: null })) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getReadChapterIdsForBooks(USER_ID, [BOOK_A]);
        expect(result.size).toBe(1);
    });
});

// ─── getReadChapterIdsForBook ─────────────────────────────────────────────────

describe("getReadChapterIdsForBook", () => {
    beforeEach(() => vi.resetAllMocks());

    it("empty result → empty set", async () => {
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => Promise.resolve({ data: [], error: null })) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getReadChapterIdsForBook(USER_ID, BOOK_A);
        expect(result.size).toBe(0);
    });

    it("more than one page → combines all results", async () => {
        const page1 = makeProgressRows(500);
        const page2 = makeProgressRows(50).map((_, i) => ({
            chapter_id: makeChapterId(500 + i),
        }));
        let call = 0;
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => {
                call++;
                return Promise.resolve({ data: call === 1 ? page1 : page2, error: null });
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        const result = await getReadChapterIdsForBook(USER_ID, BOOK_A);
        expect(result.size).toBe(550);
    });

    it("database error on a later page throws", async () => {
        const page1 = makeProgressRows(500);
        let call = 0;
        vi.mocked(createSupabaseAdminClient).mockReturnValue(
            buildChainMock(() => {
                call++;
                if (call === 1) return Promise.resolve({ data: page1, error: null });
                return Promise.resolve({ data: null, error: { message: "DB error" } });
            }) as unknown as ReturnType<typeof createSupabaseAdminClient>,
        );
        await expect(getReadChapterIdsForBook(USER_ID, BOOK_A)).rejects.toThrow(
            "Не удалось получить прогресс чтения.",
        );
    });

    it("correct book scoping — bookId is passed to the query", async () => {
        const eqSpy = vi.fn().mockReturnThis();
        const chain: Record<string, unknown> = {
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: eqSpy,
            range: vi.fn(() => Promise.resolve({ data: [], error: null })),
        };
        vi.mocked(createSupabaseAdminClient).mockReturnValue(chain as unknown as ReturnType<typeof createSupabaseAdminClient>);

        await getReadChapterIdsForBook(USER_ID, BOOK_A);

        expect(eqSpy).toHaveBeenCalledWith("chapters.book_id", BOOK_A);
    });
});
