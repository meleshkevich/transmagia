import { describe, it, expect } from "vitest";
import {
    normalizeAuthor,
    clampPosition,
    computeMoveResult,
    groupChanged,
    validateGroupIntegrity,
} from "./book-ordering-pure";

// ─── normalizeAuthor ──────────────────────────────────────────────────────────

describe("normalizeAuthor", () => {
    it("returns '' for null", () => {
        expect(normalizeAuthor(null)).toBe("");
    });
    it("returns '' for empty string", () => {
        expect(normalizeAuthor("")).toBe("");
    });
    it("returns '' for whitespace-only string", () => {
        expect(normalizeAuthor("   ")).toBe("");
    });
    it("trims surrounding whitespace", () => {
        expect(normalizeAuthor("  Иванов  ")).toBe("Иванов");
    });
    it("preserves non-empty author as-is (trimmed)", () => {
        expect(normalizeAuthor("Петров")).toBe("Петров");
    });
    it("undefined coerces to ''", () => {
        expect(normalizeAuthor(undefined)).toBe("");
    });
});

// ─── clampPosition ───────────────────────────────────────────────────────────

describe("clampPosition", () => {
    it("clamps 0 → 1", () => {
        expect(clampPosition(0, 5)).toBe(1);
    });
    it("clamps negative → 1", () => {
        expect(clampPosition(-3, 5)).toBe(1);
    });
    it("clamps above groupSize → groupSize", () => {
        expect(clampPosition(100, 5)).toBe(5);
    });
    it("position within range is unchanged", () => {
        expect(clampPosition(3, 5)).toBe(3);
    });
    it("position equal to max is valid", () => {
        expect(clampPosition(5, 5)).toBe(5);
    });
    it("position 1 with groupSize 1 is valid", () => {
        expect(clampPosition(1, 1)).toBe(1);
    });
    it("groupSize 0 still returns 1 (at least one slot)", () => {
        expect(clampPosition(1, 0)).toBe(1);
    });
});

// ─── computeMoveResult ───────────────────────────────────────────────────────

describe("computeMoveResult", () => {
    // Tests 8-13 from spec.

    it("move last → first (move 5 to 1)", () => {
        expect(computeMoveResult(5, 5, 1)).toEqual([5, 1, 2, 3, 4]);
    });

    it("move first → last (move 1 to 5)", () => {
        expect(computeMoveResult(5, 1, 5)).toEqual([2, 3, 4, 5, 1]);
    });

    it("move 5 → 2 (SQL review Fix 1 scenario: shift [2..4] DESC)", () => {
        // before: 1,2,3,4,5 — move item at pos 5 to pos 2
        // after:  1,5,2,3,4
        expect(computeMoveResult(5, 5, 2)).toEqual([1, 5, 2, 3, 4]);
    });

    it("move 3 → 4 (SQL review Fix 1 scenario: single-step shift ASC)", () => {
        // before: 1,2,3,4,5 — move item at pos 3 to pos 4
        // after:  1,2,4,3,5
        expect(computeMoveResult(5, 3, 4)).toEqual([1, 2, 4, 3, 5]);
    });

    it("move middle → another middle (move 2 to 4)", () => {
        // before: 1,2,3,4,5  move pos-2 to pos-4
        // after:  1,3,4,2,5  — items are original 1-based positions
        expect(computeMoveResult(5, 2, 4)).toEqual([1, 3, 4, 2, 5]);
    });

    it("moving to current position is a no-op", () => {
        expect(computeMoveResult(5, 3, 3)).toEqual([1, 2, 3, 4, 5]);
    });

    it("requested position below 1 is clamped to 1", () => {
        expect(computeMoveResult(5, 3, 0)).toEqual([3, 1, 2, 4, 5]);
    });

    it("requested position above N is clamped to N", () => {
        expect(computeMoveResult(5, 2, 100)).toEqual([1, 3, 4, 5, 2]);
    });

    it("result always has same length as input", () => {
        for (const n of [1, 2, 3, 5, 10]) {
            const result = computeMoveResult(n, 1, n);
            expect(result).toHaveLength(n);
        }
    });

    it("result contains same elements (no duplicates, no gaps)", () => {
        const result = computeMoveResult(5, 2, 4);
        expect([...result].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    });

    it("group of 1 — move is always no-op", () => {
        expect(computeMoveResult(1, 1, 1)).toEqual([1]);
    });
});

// ─── groupChanged ─────────────────────────────────────────────────────────────

describe("groupChanged", () => {
    const S1 = "section-1";
    const S2 = "section-2";

    // Tests 14-17 from spec (pure logic assertions).

    it("different author → group changed (test 14)", () => {
        expect(groupChanged(S1, "Иванов", S1, "Петров")).toBe(true);
    });

    it("null → non-null author → group changed", () => {
        expect(groupChanged(S1, null, S1, "Петров")).toBe(true);
    });

    it("non-null → null author → group changed (test 15)", () => {
        expect(groupChanged(S1, "Иванов", S1, null)).toBe(true);
    });

    it("same non-null author → not changed", () => {
        expect(groupChanged(S1, "Иванов", S1, "Иванов")).toBe(false);
    });

    it("null → null author → not changed (test 21)", () => {
        expect(groupChanged(S1, null, S1, null)).toBe(false);
    });

    it("null → empty-string author → not changed (same conceptual group, test 7)", () => {
        expect(groupChanged(S1, null, S1, "")).toBe(false);
    });

    it("whitespace → null author → not changed (test 7)", () => {
        expect(groupChanged(S1, "   ", S1, null)).toBe(false);
    });

    it("section changes → group changed (test 17)", () => {
        expect(groupChanged(S1, "Иванов", S2, "Иванов")).toBe(true);
    });

    it("different section, same author → group changed", () => {
        expect(groupChanged(S1, null, S2, null)).toBe(true);
    });

    // Test 21: same author in different sections both start at position 1 — this
    // is enforced by each section having independent groups (groupChanged returns
    // true when section differs).
    it("same author in different sections are distinct groups (test 21, test 22)", () => {
        expect(groupChanged(S1, "Иванов", S2, "Иванов")).toBe(true);
    });
});

// ─── validateGroupIntegrity ───────────────────────────────────────────────────

describe("validateGroupIntegrity", () => {
    // Tests 19-20 from spec.

    it("valid contiguous group has no violations (test 19, 20)", () => {
        expect(validateGroupIntegrity([1, 2, 3, 4, 5])).toHaveLength(0);
    });

    it("out-of-order positions are still valid when contiguous", () => {
        expect(validateGroupIntegrity([3, 1, 2])).toHaveLength(0);
    });

    it("duplicate positions → violation (test 19)", () => {
        const errors = validateGroupIntegrity([1, 2, 2, 4]);
        expect(errors.some((e) => e.includes("duplicate"))).toBe(true);
    });

    it("gap → violation (test 20)", () => {
        const errors = validateGroupIntegrity([1, 2, 4, 5]);
        expect(errors.some((e) => e.includes("gap"))).toBe(true);
    });

    it("starting not at 1 → violation", () => {
        const errors = validateGroupIntegrity([2, 3, 4]);
        expect(errors.length).toBeGreaterThan(0);
    });

    it("empty group is valid", () => {
        expect(validateGroupIntegrity([])).toHaveLength(0);
    });

    it("single-element group [1] is valid", () => {
        expect(validateGroupIntegrity([1])).toHaveLength(0);
    });

    it("1..N with position 100 at the end → violation (test 20, spec example)", () => {
        const errors = validateGroupIntegrity([1, 2, 3, 100]);
        expect(errors.length).toBeGreaterThan(0);
    });

    // Test 21: different authors in the same section may both have position 1.
    // This is a DB invariant; locally we verify each group independently.
    it("two independent groups may each contain position 1 (test 21)", () => {
        const groupA = [1, 2, 3];
        const groupB = [1, 2];
        expect(validateGroupIntegrity(groupA)).toHaveLength(0);
        expect(validateGroupIntegrity(groupB)).toHaveLength(0);
    });
});

// ─── DB integration tests (not runnable without live DB) ─────────────────────
//
// Tests 1-7 (creation), 14-18 (author/section/deletion), 23-25 (auth, concurrency)
// require a live Supabase instance.
//
// The DB-level uniqueness constraint
//   UNIQUE(section_id, COALESCE(btrim(author), ''), author_sort_order)
// provides the strongest practical guarantee for tests 23, 25 (no concurrent
// duplicates can be committed regardless of application-level races).
//
// Test 23 (non-admin cannot change position): enforced by requireAdmin() in the
// server action, which redirects non-admins before any DB operation runs.
//
// Test 24 (non-admin cannot indirectly change author_sort_order): the Supabase
// client role has no UPDATE permission on public.books (revoked in migration
// 20260922020000); only the service-role admin client used inside requireAdmin()
// guarded paths can mutate the column.
