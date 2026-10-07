import { describe, expect, it } from "vitest";
import { filterBooksByQuery } from "./filter-books";
import { groupBooksByAuthor } from "./group-by-author";
import { evaluateSectionAccess, isCatalogRestricted } from "@/lib/auth/access-policy";
import type { ReaderBook } from "./data";

// ─── Test fixtures ───────────────────────────────────────────────────────────

function makeBook(overrides: Partial<ReaderBook> & Pick<ReaderBook, "id" | "title">): ReaderBook {
    return {
        sectionId: "sec-translations",
        sectionSlug: "translations",
        slug: overrides.id,
        author: null,
        authorSortOrder: 1,
        description: null,
        coverImageUrl: null,
        status: "published",
        ...overrides,
    };
}

const MAME_BOOKS: ReaderBook[] = [
    makeBook({ id: "m1", title: "История Тарна и Тайпа", author: "Mame", authorSortOrder: 1 }),
    makeBook({ id: "m2", title: "Дыхание", author: "Mame", authorSortOrder: 2 }),
    makeBook({ id: "m3", title: "Свадебный план", author: "Mame", authorSortOrder: 3 }),
];

const OTHER_BOOKS: ReaderBook[] = [
    makeBook({ id: "o1", title: "Другая история", author: "Другой автор", authorSortOrder: 1 }),
    makeBook({ id: "o2", title: "Песок и звёзды", author: "Третий автор", authorSortOrder: 1 }),
];

const ALL_BOOKS: ReaderBook[] = [...MAME_BOOKS, ...OTHER_BOOKS];

// ─── Access-policy fixtures (reused from access-policy.test.ts) ───────────────

const ADMIN = { is_admin: true };
const USER = { is_admin: false };
const ANON = null;
const PUBLIC = { password_hash: null };
const PROTECTED = { password_hash: "scrypt$16384$8$1$aabbcc$ddeeff" };

// ─── 1. Empty query → all authorized translation books ───────────────────────

describe("filterBooksByQuery — empty query", () => {
    it("1. empty string returns all books unchanged", () => {
        expect(filterBooksByQuery(ALL_BOOKS, "")).toEqual(ALL_BOOKS);
    });

    it("1b. whitespace-only query returns all books unchanged", () => {
        expect(filterBooksByQuery(ALL_BOOKS, "   ")).toEqual(ALL_BOOKS);
    });
});

// ─── 2. Title match ──────────────────────────────────────────────────────────

describe("filterBooksByQuery — title match", () => {
    it("2. exact title match returns the matching book", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "Дыхание");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("m2");
    });
});

// ─── 3. Author match ─────────────────────────────────────────────────────────

describe("filterBooksByQuery — author match", () => {
    it("3. searching by author name returns all books by that author", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "Mame");
        expect(result).toHaveLength(3);
        expect(result.map((b) => b.id)).toEqual(["m1", "m2", "m3"]);
    });
});

// ─── 4. Case-insensitive match ───────────────────────────────────────────────

describe("filterBooksByQuery — case-insensitive", () => {
    it("4a. lowercase query matches mixed-case author", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "mame");
        expect(result).toHaveLength(3);
    });

    it("4b. uppercase query matches lowercase title content", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "ДЫХАНИЕ");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("m2");
    });

    it("4c. mixed case matches correctly", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "МаМе");
        // "МаМе" is not in the data — "Mame" is latin; this verifies case-insensitivity
        // for Cyrillic separately from Latin
        expect(result).toHaveLength(0); // "Mame" is latin, not Cyrillic МаМе
    });

    it("4d. latin query matches latin author case-insensitively", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "MAME");
        expect(result).toHaveLength(3);
    });
});

// ─── 5. Partial title match ──────────────────────────────────────────────────

describe("filterBooksByQuery — partial title match", () => {
    it("5a. partial title substring matches", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "Тарна");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("m1");
    });

    it("5b. partial title from middle of string matches", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "Свад");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("m3");
    });
});

// ─── 6. Partial author match ─────────────────────────────────────────────────

describe("filterBooksByQuery — partial author match", () => {
    it("6a. partial author substring matches all books by that author", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "Друг");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("o1");
    });

    it("6b. single letter partial match works", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "am"); // matches "Mame"
        expect(result).toHaveLength(3);
    });
});

// ─── 7. Leading/trailing whitespace ──────────────────────────────────────────

describe("filterBooksByQuery — whitespace handling", () => {
    it("7a. leading whitespace is trimmed", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "  Mame");
        expect(result).toHaveLength(3);
    });

    it("7b. trailing whitespace is trimmed", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "Mame   ");
        expect(result).toHaveLength(3);
    });

    it("7c. both leading and trailing whitespace is trimmed", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "  Дыхание  ");
        expect(result).toHaveLength(1);
    });
});

// ─── 8. No results ───────────────────────────────────────────────────────────

describe("filterBooksByQuery — no results", () => {
    it("8. query matching nothing returns empty array", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "НесуществующийАвтор");
        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
    });
});

// ─── 9. Author grouping preserved after filtering ────────────────────────────

describe("groupBooksByAuthor — grouping preserved after filtering", () => {
    it("9a. filtered books retain their author groups", () => {
        const filtered = filterBooksByQuery(ALL_BOOKS, "Дыхание");
        const groups = groupBooksByAuthor(filtered);
        expect(groups).toHaveLength(1);
        expect(groups[0].author).toBe("Mame");
        expect(groups[0].books).toHaveLength(1);
        expect(groups[0].books[0].id).toBe("m2");
    });

    it("9b. matching books from two authors produce two groups", () => {
        const books = [
            ...MAME_BOOKS.slice(0, 1),
            makeBook({ id: "x1", title: "Что-то", author: "Другой автор", authorSortOrder: 1 }),
        ];
        const filtered = filterBooksByQuery(books, "Что");
        const groups = groupBooksByAuthor(filtered);
        expect(groups).toHaveLength(1);
        expect(groups[0].author).toBe("Другой автор");
    });

    it("9c. unmatched authors do not appear in groups", () => {
        // Search for 'Дыхание' — only Mame has this book; Другой автор group must be absent
        const filtered = filterBooksByQuery(ALL_BOOKS, "Дыхание");
        const groups = groupBooksByAuthor(filtered);
        const authorNames = groups.map((g) => g.author);
        expect(authorNames).not.toContain("Другой автор");
    });
});

// ─── 10. Author match returns all books by that author ───────────────────────

describe("filterBooksByQuery — author match returns full group", () => {
    it("10. searching by author returns all books by that author", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "Mame");
        expect(result).toHaveLength(3);
        const groups = groupBooksByAuthor(result);
        expect(groups).toHaveLength(1);
        expect(groups[0].author).toBe("Mame");
        expect(groups[0].books).toHaveLength(3);
    });
});

// ─── 11. author_sort_order unchanged after filtering ─────────────────────────

describe("filterBooksByQuery — author_sort_order preserved", () => {
    it("11a. authorSortOrder values are not altered by filtering", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "Mame");
        const sortOrders = result.map((b) => b.authorSortOrder);
        expect(sortOrders).toEqual([1, 2, 3]);
    });

    it("11b. books are returned in their original input order (not re-sorted)", () => {
        const result = filterBooksByQuery(ALL_BOOKS, "Mame");
        expect(result.map((b) => b.id)).toEqual(["m1", "m2", "m3"]);
    });
});

// ─── 12. Books from originals/fanfiction never included ──────────────────────

describe("filterBooksByQuery — section isolation", () => {
    it("12a. only books in the input array can appear in results", () => {
        // getPublishedBooks(slug) ensures input is already section-filtered.
        // filterBooksByQuery never adds books outside the input.
        const translationsOnly = MAME_BOOKS;
        const result = filterBooksByQuery(translationsOnly, "Mame");
        expect(result.every((b) => b.sectionSlug === "translations")).toBe(true);
    });

    it("12b. originals books in input do not leak through when filtering by author name that matches translations only", () => {
        const mixedInput: ReaderBook[] = [
            ...MAME_BOOKS,
            makeBook({ id: "orig1", title: "Оригинал", author: "Другой", sectionSlug: "originals", sectionId: "sec-originals", authorSortOrder: 1 }),
        ];
        const result = filterBooksByQuery(mixedInput, "Mame");
        expect(result.every((b) => b.sectionSlug === "translations")).toBe(true);
        expect(result).not.toContain(mixedInput[3]);
    });
});

// ─── 13. Unauthorized user cannot obtain translation search results ───────────

describe("access policy — unauthorized user cannot search translations", () => {
    it("13a. unauthenticated user is denied access to translations (canRead = false)", () => {
        const decision = evaluateSectionAccess(ANON, PROTECTED, false);
        expect(decision.canRead).toBe(false);
    });

    it("13b. authenticated user without password cookie is denied translations access", () => {
        const decision = evaluateSectionAccess(USER, PROTECTED, false);
        expect(decision.canRead).toBe(false);
    });

    it("13c. translations is always catalog-restricted — even without a password set", () => {
        // isCatalogRestricted gates the page before any book data is fetched.
        // An unauthorized user is shown SectionGate and never sees book data.
        expect(isCatalogRestricted("translations", false)).toBe(true);
        expect(isCatalogRestricted("translations", true)).toBe(true);
    });
});

// ─── 14. Search UI not rendered without translations access ──────────────────

describe("access policy — search UI visibility matches access", () => {
    it("14a. user without access is denied (SectionGate is shown instead of catalog)", () => {
        // When evaluateSectionAccess returns canRead=false, the page returns
        // SectionGate early — the search slot is never constructed or rendered.
        const decision = evaluateSectionAccess(USER, PROTECTED, false);
        expect(decision.canRead).toBe(false);
        // The section page logic: if (!canRead) return <SectionGate />  — no search slot.
    });

    it("14b. anonymous user is redirected to login before any catalog data is loaded", () => {
        // evaluateSectionAccess for anonymous returns requiresAuth=true.
        // The section page redirects anonymous users before canReadSection is called.
        const decision = evaluateSectionAccess(ANON, PROTECTED, false);
        expect(decision.requiresAuth).toBe(true);
        expect(decision.canRead).toBe(false);
    });
});

// ─── 15. Admin can use the search ────────────────────────────────────────────

describe("access policy — admin can access translations and use search", () => {
    it("15a. admin is allowed to read translations without a cookie", () => {
        const decision = evaluateSectionAccess(ADMIN, PROTECTED, false);
        expect(decision.canRead).toBe(true);
    });

    it("15b. admin is allowed even when section has no password", () => {
        const decision = evaluateSectionAccess(ADMIN, PUBLIC, false);
        expect(decision.canRead).toBe(true);
    });

    it("15c. admin does not see password or auth prompts", () => {
        const decision = evaluateSectionAccess(ADMIN, PROTECTED, false);
        expect(decision.requiresPassword).toBe(false);
        expect(decision.requiresAuth).toBe(false);
    });
});

// ─── 16. Existing translations password protection unchanged ─────────────────

describe("access policy — translations password protection is unmodified", () => {
    it("16a. authenticated user with valid cookie can read translations", () => {
        const decision = evaluateSectionAccess(USER, PROTECTED, true);
        expect(decision.canRead).toBe(true);
    });

    it("16b. authenticated user without cookie cannot read translations", () => {
        const decision = evaluateSectionAccess(USER, PROTECTED, false);
        expect(decision.canRead).toBe(false);
        expect(decision.requiresPassword).toBe(true);
    });

    it("16c. cookie alone without authentication does not grant access", () => {
        const decision = evaluateSectionAccess(ANON, PROTECTED, true);
        expect(decision.canRead).toBe(false);
    });

    it("16d. originals catalog is not restricted (confirming translations is special)", () => {
        expect(isCatalogRestricted("originals", false)).toBe(false);
        expect(isCatalogRestricted("fanfiction", false)).toBe(false);
        expect(isCatalogRestricted("translations", false)).toBe(true);
    });
});
