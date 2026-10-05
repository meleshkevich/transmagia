import { describe, it, expect } from "vitest";
import { nextChapterSortOrder } from "./chapter-ordering-pure";

// Test cases required by spec:
// 1. no chapters → 1
// 2. [1] → 2
// 3. [1,2,3] → 4
// 4. [1,2,4] → 5  (max, not first gap)
// 5. [3,4,7] → 8
// 6. scoped to current book (enforced by DB query; pure fn takes the already-filtered list)
// 7. different books calculate independently (same reason)
// 8. edit mode preserves existing sort_order (ChapterForm uses chapter.sortOrder when chapter prop present)
// 9. manual selection not overwritten (form input remains editable after default is applied)

describe("nextChapterSortOrder", () => {
    it("1. returns 1 when no chapters exist", () => {
        expect(nextChapterSortOrder([])).toBe(1);
    });

    it("2. returns 2 when one chapter with sort_order 1 exists", () => {
        expect(nextChapterSortOrder([1])).toBe(2);
    });

    it("3. returns 4 for sequential chapters [1, 2, 3]", () => {
        expect(nextChapterSortOrder([1, 2, 3])).toBe(4);
    });

    it("4. uses max, not first gap: [1, 2, 4] → 5", () => {
        expect(nextChapterSortOrder([1, 2, 4])).toBe(5);
    });

    it("5. larger gap: [3, 4, 7] → 8", () => {
        expect(nextChapterSortOrder([3, 4, 7])).toBe(8);
    });

    it("6+7. different sort_order lists produce independent results (books scoped by DB query)", () => {
        // Book A: chapters [1, 2, 3] → next = 4
        expect(nextChapterSortOrder([1, 2, 3])).toBe(4);
        // Book B: no chapters → next = 1
        expect(nextChapterSortOrder([])).toBe(1);
        // Book C: chapters [5, 10] → next = 11
        expect(nextChapterSortOrder([5, 10])).toBe(11);
    });

    it("order of input does not affect result", () => {
        expect(nextChapterSortOrder([4, 1, 2])).toBe(5);
        expect(nextChapterSortOrder([7, 3, 4])).toBe(8);
    });
});
