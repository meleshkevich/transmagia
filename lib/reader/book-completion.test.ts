import { describe, it, expect } from "vitest";
import { getCompletedBookIds } from "./book-completion";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BOOK_A = "aaaaaaaa-0000-4000-8000-000000000001";
const BOOK_B = "bbbbbbbb-0000-4000-8000-000000000002";
const BOOK_C = "cccccccc-0000-4000-8000-000000000003";

const CH_A1 = "a1a1a1a1-0000-4000-8000-000000000001";
const CH_A2 = "a2a2a2a2-0000-4000-8000-000000000002";
const CH_B1 = "b1b1b1b1-0000-4000-8000-000000000003";
const CH_C1 = "c1c1c1c1-0000-4000-8000-000000000004";
const CH_C2 = "c2c2c2c2-0000-4000-8000-000000000005";
const CH_C3 = "c3c3c3c3-0000-4000-8000-000000000006";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("getCompletedBookIds", () => {
    // ── Test 15: zero published chapters → not completed ──────────────────────

    it("15. book with zero published chapters is NOT completed", () => {
        const publishedByBook = new Map([[BOOK_A, []]]);
        const readIds = new Set<string>();
        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_A)).toBe(false);
    });

    it("15b. empty map → empty result", () => {
        const result = getCompletedBookIds(new Map(), new Set());
        expect(result.size).toBe(0);
    });

    // ── Test 16: one published chapter read → completed ────────────────────────

    it("16. book with one published chapter that is read → completed", () => {
        const publishedByBook = new Map([[BOOK_B, [CH_B1]]]);
        const readIds = new Set([CH_B1]);
        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_B)).toBe(true);
    });

    // ── Test 17: one published chapter unread → not completed ─────────────────

    it("17. book with one published chapter that is NOT read → not completed", () => {
        const publishedByBook = new Map([[BOOK_B, [CH_B1]]]);
        const readIds = new Set<string>();
        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_B)).toBe(false);
    });

    // ── Test 18: all published chapters read → completed ──────────────────────

    it("18. all published chapters read → completed", () => {
        const publishedByBook = new Map([[BOOK_A, [CH_A1, CH_A2]]]);
        const readIds = new Set([CH_A1, CH_A2]);
        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_A)).toBe(true);
    });

    // ── Test 19: some chapters unread → not completed ─────────────────────────

    it("19. only some published chapters read → not completed", () => {
        const publishedByBook = new Map([[BOOK_A, [CH_A1, CH_A2]]]);
        const readIds = new Set([CH_A1]);
        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_A)).toBe(false);
    });

    // ── Test 20: draft chapters excluded (not in publishedByBook) ─────────────

    it("20. draft chapters are not in the published set and do not block completion", () => {
        // Only CH_A1 is published; CH_A2 is draft and excluded from publishedByBook.
        const publishedByBook = new Map([[BOOK_A, [CH_A1]]]);
        const readIds = new Set([CH_A1]);
        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_A)).toBe(true);
    });

    // ── Test 21: new chapter removes completed state ───────────────────────────

    it("21. adding a new published chapter (10/11) removes completed state", () => {
        // Simulate: user has read CH_A1 and CH_A2 (10/10 previously),
        // then CH_C1 is newly published (11th chapter in BOOK_A).
        const CH_NEW = "dddddddd-0000-4000-8000-000000000007";
        const publishedByBook = new Map([[BOOK_A, [CH_A1, CH_A2, CH_NEW]]]);
        const readIds = new Set([CH_A1, CH_A2]);
        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_A)).toBe(false);
    });

    // ── Test 22: ongoing book can be completed ────────────────────────────────

    it("22. ongoing book is completed when all published chapters are read", () => {
        // Book status does not appear in this pure function — completion depends
        // solely on published chapter counts, not the book's status field.
        const publishedByBook = new Map([[BOOK_B, [CH_B1]]]);
        const readIds = new Set([CH_B1]);
        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_B)).toBe(true);
    });

    // ── Test 23: published book can be completed ──────────────────────────────

    it("23. published book is completed when all published chapters are read", () => {
        const publishedByBook = new Map([[BOOK_A, [CH_A1, CH_A2]]]);
        const readIds = new Set([CH_A1, CH_A2]);
        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_A)).toBe(true);
    });

    // ── Test 24: completion is user-specific (pure function isolation) ─────────

    it("24. completion uses only the provided readIds — each call is independent", () => {
        const publishedByBook = new Map([[BOOK_A, [CH_A1, CH_A2]]]);

        // User A has read both
        const user_a_read = new Set([CH_A1, CH_A2]);
        // User B has read none
        const user_b_read = new Set<string>();

        expect(getCompletedBookIds(publishedByBook, user_a_read).has(BOOK_A)).toBe(true);
        expect(getCompletedBookIds(publishedByBook, user_b_read).has(BOOK_A)).toBe(false);
    });

    // ── Multiple books at once ────────────────────────────────────────────────

    it("returns completed and non-completed books correctly in a mixed set", () => {
        const publishedByBook = new Map([
            [BOOK_A, [CH_A1, CH_A2]],       // 2 published chapters
            [BOOK_B, [CH_B1]],               // 1 published chapter
            [BOOK_C, [CH_C1, CH_C2, CH_C3]], // 3 published chapters
        ]);

        // User has read all of A and B, but only 2/3 of C
        const readIds = new Set([CH_A1, CH_A2, CH_B1, CH_C1, CH_C2]);

        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_A)).toBe(true);
        expect(result.has(BOOK_B)).toBe(true);
        expect(result.has(BOOK_C)).toBe(false);
    });

    it("correctly excludes chapters from other books", () => {
        // Chapters from BOOK_B should not count toward BOOK_A completion.
        const publishedByBook = new Map([
            [BOOK_A, [CH_A1]],
            [BOOK_B, [CH_B1]],
        ]);
        // Only BOOK_B's chapter is read
        const readIds = new Set([CH_B1]);

        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_A)).toBe(false);
        expect(result.has(BOOK_B)).toBe(true);
    });

    it("zero-published books coexist with completed books without affecting each other", () => {
        const publishedByBook = new Map([
            [BOOK_A, []],      // no chapters → never completed
            [BOOK_B, [CH_B1]], // 1 chapter, read
        ]);
        const readIds = new Set([CH_B1]);

        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_A)).toBe(false);
        expect(result.has(BOOK_B)).toBe(true);
    });

    // ── Test 32 (duplicate prevention is in DB): idempotency of read set ──────

    it("32. duplicate chapter IDs in readIds do not cause double-counting (Set semantics)", () => {
        // A Set naturally deduplicates. This confirms the function is safe.
        const publishedByBook = new Map([[BOOK_A, [CH_A1, CH_A2]]]);
        const readIds = new Set([CH_A1, CH_A1, CH_A2]); // duplicate CH_A1
        const result = getCompletedBookIds(publishedByBook, readIds);
        expect(result.has(BOOK_A)).toBe(true);
    });
});
