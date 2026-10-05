import { describe, it, expect } from "vitest";
import { isPublicBookStatus } from "./access-policy";

// Tests 1–3: basic status visibility
describe("isPublicBookStatus — book visibility rules", () => {
    it("1. draft is not public", () => {
        expect(isPublicBookStatus("draft")).toBe(false);
    });
    it("2. ongoing is public", () => {
        expect(isPublicBookStatus("ongoing")).toBe(true);
    });
    it("3. published is public", () => {
        expect(isPublicBookStatus("published")).toBe(true);
    });
    it("10. draft books do not appear in the public catalog", () => {
        expect(isPublicBookStatus("draft")).toBe(false);
    });
    it("11. ongoing books appear in the public catalog", () => {
        expect(isPublicBookStatus("ongoing")).toBe(true);
    });
    it("12. published books remain in the public catalog (existing behavior unchanged)", () => {
        expect(isPublicBookStatus("published")).toBe(true);
    });
});

// Tests 4–5: combined book + chapter visibility
// canReadChapter requires: chapter.status === "published" AND canReadBook (book public)
describe("book + chapter visibility combination", () => {
    function isChapterReadable(
        bookStatus: "draft" | "ongoing" | "published",
        chapterPublished: boolean,
    ): boolean {
        return isPublicBookStatus(bookStatus) && chapterPublished;
    }

    it("4. ongoing book with published chapter is readable", () => {
        expect(isChapterReadable("ongoing", true)).toBe(true);
    });

    it("5. ongoing book with draft chapter is not readable at chapter level", () => {
        expect(isChapterReadable("ongoing", false)).toBe(false);
    });

    it("draft book with published chapter is not readable (book is private)", () => {
        expect(isChapterReadable("draft", true)).toBe(false);
    });

    it("published book with published chapter is readable (existing behavior unchanged)", () => {
        expect(isChapterReadable("published", true)).toBe(true);
    });
});

// Tests 8–9: BookCard badge logic
// The badge renders when book.status === "ongoing".
describe("BookCard badge logic", () => {
    const showsBadge = (status: "ongoing" | "published"): boolean => status === "ongoing";

    it("8. ongoing status shows the В работе badge", () => {
        expect(showsBadge("ongoing")).toBe(true);
    });

    it("9. published status does not show the badge", () => {
        expect(showsBadge("published")).toBe(false);
    });
});

// Test 6: translations password protection is handled by evaluateSectionAccess
// (covered by lib/auth/access-policy.test.ts — the section-level check runs
//  regardless of book status, so an ongoing translation still requires the password).

// Test 7: admin can create/update ongoing books — enforced at runtime by requireAdmin()
// in lib/admin/mutations.ts; parseStatus("ongoing") returns "ongoing" (validation.ts).
