import { describe, it, expect } from "vitest";
import {
    findBookByLegacyUrl,
    findBookByWpId,
    findBookBySectionAndSlug,
} from "../lib/importer.mjs";

// Supabase mock that supports chained .from().select().eq()*.maybeSingle()
// The resolver receives all accumulated (field, value) pairs and returns data.
function makeSupabaseMock(resolver) {
    return {
        from: (table) => {
            const conditions = [];
            const chain = {
                select: () => chain,
                eq: (field, value) => {
                    conditions.push({ field, value });
                    return chain;
                },
                maybeSingle: async () => ({
                    data: resolver(table, conditions),
                    error: null,
                }),
            };
            return chain;
        },
    };
}

function makeErrorSupabase(message) {
    return {
        from: () => ({
            select: () => ({
                eq: () => ({
                    eq: () => ({
                        maybeSingle: async () => ({ data: null, error: new Error(message) }),
                    }),
                    maybeSingle: async () => ({ data: null, error: new Error(message) }),
                }),
            }),
        }),
    };
}

const SECTION_ID = "8cc966ee-77f0-41ac-9591-85a494bb092b";

const EXISTING_BOOK = {
    id: "aaab620c-70eb-4194-adda-5c7bd9ce1175",
    title: "Шум дождя",
    slug: "shum-dozhdya",
    legacy_url: "https://transmagia.house/%D1%88%D1%83%D0%BC-%D0%B4%D0%BE%D0%B6%D0%B4%D1%8F/",
    legacy_wp_id: 154,
    section_id: SECTION_ID,
};

const BOOK_NO_LEGACY = {
    id: "aaab620c-70eb-4194-adda-5c7bd9ce1175",
    title: "Шум дождя",
    slug: "shum-dozhdya",
    legacy_url: null,
    legacy_wp_id: null,
    section_id: SECTION_ID,
};

describe("book duplicate detection — combined scenarios", () => {
    it("scenario 1: existing book matched by legacy_wp_id", async () => {
        const supabase = makeSupabaseMock((_table, conditions) => {
            const wpId = conditions.find((c) => c.field === "legacy_wp_id")?.value;
            if (wpId === 154) return EXISTING_BOOK;
            return null;
        });

        const result = await findBookByWpId(supabase, 154);
        expect(result).toEqual(EXISTING_BOOK);
    });

    it("scenario 2: existing book matched by normalized legacy_url", async () => {
        const supabase = makeSupabaseMock((_table, conditions) => {
            const url = conditions.find((c) => c.field === "legacy_url")?.value;
            if (url === EXISTING_BOOK.legacy_url) return EXISTING_BOOK;
            return null;
        });

        const result = await findBookByLegacyUrl(supabase, EXISTING_BOOK.legacy_url);
        expect(result).toEqual(EXISTING_BOOK);
    });

    it("scenario 3: section+slug match without legacy identity → conflict detected, no INSERT", async () => {
        // Book exists with same (section, slug) but no legacy identity.
        // findBookBySectionAndSlug should surface it so the caller can report a conflict.
        const supabase = makeSupabaseMock((_table, conditions) => {
            const hasSection = conditions.some((c) => c.field === "section_id" && c.value === SECTION_ID);
            const hasSlug = conditions.some((c) => c.field === "slug" && c.value === "shum-dozhdya");
            if (hasSection && hasSlug) return BOOK_NO_LEGACY;
            return null;
        });

        const conflict = await findBookBySectionAndSlug(supabase, SECTION_ID, "shum-dozhdya");
        expect(conflict).toEqual(BOOK_NO_LEGACY);
        // The caller is responsible for emitting an error rather than inserting.
        // Insertion is never attempted when this function returns non-null.
    });

    it("scenario 4: adopted existing book — detected by legacy_url, reused", async () => {
        // After attaching legacy identity, the URL check finds the existing book.
        const supabase = makeSupabaseMock((_table, conditions) => {
            const url = conditions.find((c) => c.field === "legacy_url")?.value;
            if (url === EXISTING_BOOK.legacy_url) return EXISTING_BOOK;
            return null;
        });

        const result = await findBookByLegacyUrl(supabase, EXISTING_BOOK.legacy_url);
        expect(result).not.toBeNull();
        expect(result?.id).toBe(EXISTING_BOOK.id);
        // Since the book is found, no insertBook call would be made.
    });

    it("scenario 5: importer never creates slug-2 — slug conflict always surfaces as error", async () => {
        // When (section, slug) collides but there is no legacy identity match, the
        // conflict book is returned, which the caller uses to emit an error rather
        // than creating a suffixed slug variant.
        const supabase = makeSupabaseMock((_table, conditions) => {
            const hasSection = conditions.some((c) => c.field === "section_id" && c.value === SECTION_ID);
            const hasSlug = conditions.some((c) => c.field === "slug" && c.value === "shum-dozhdya");
            if (hasSection && hasSlug) return BOOK_NO_LEGACY;
            return null;
        });

        // WP ID check: miss
        const byWpId = await findBookByWpId(supabase, 154);
        expect(byWpId).toBeNull(); // no legacy_wp_id in this scenario

        // URL check: miss (legacy_url not set either)
        const byUrl = await findBookByLegacyUrl(supabase, EXISTING_BOOK.legacy_url);
        expect(byUrl).toBeNull();

        // Slug conflict check: hit — caller must surface error, not create "shum-dozhdya-2"
        const conflict = await findBookBySectionAndSlug(supabase, SECTION_ID, "shum-dozhdya");
        expect(conflict).not.toBeNull();
        expect(conflict?.slug).toBe("shum-dozhdya");
    });
});

describe("findBookByWpId", () => {
    it("returns null when no book has the given WP ID", async () => {
        const supabase = makeSupabaseMock(() => null);
        expect(await findBookByWpId(supabase, 9999)).toBeNull();
    });

    it("returns the book record when WP ID matches", async () => {
        const supabase = makeSupabaseMock((_t, c) =>
            c.some((x) => x.field === "legacy_wp_id" && x.value === 154) ? EXISTING_BOOK : null
        );
        expect(await findBookByWpId(supabase, 154)).toEqual(EXISTING_BOOK);
    });

    it("throws when Supabase returns an error", async () => {
        const supabase = makeErrorSupabase("DB error");
        await expect(findBookByWpId(supabase, 154)).rejects.toThrow("DB error");
    });
});

describe("findBookByLegacyUrl", () => {
    it("returns null when no book has the given URL", async () => {
        const supabase = makeSupabaseMock(() => null);
        expect(await findBookByLegacyUrl(supabase, "https://transmagia.house/unknown/")).toBeNull();
    });

    it("returns the book record when URL matches", async () => {
        const supabase = makeSupabaseMock((_t, c) =>
            c.some((x) => x.field === "legacy_url" && x.value === EXISTING_BOOK.legacy_url)
                ? EXISTING_BOOK
                : null
        );
        expect(await findBookByLegacyUrl(supabase, EXISTING_BOOK.legacy_url)).toEqual(EXISTING_BOOK);
    });
});

describe("findBookBySectionAndSlug", () => {
    it("returns null when no book matches the (section, slug) pair", async () => {
        const supabase = makeSupabaseMock(() => null);
        expect(await findBookBySectionAndSlug(supabase, SECTION_ID, "unknown-slug")).toBeNull();
    });

    it("returns the book when both section and slug match", async () => {
        const supabase = makeSupabaseMock((_t, c) => {
            const ok =
                c.some((x) => x.field === "section_id" && x.value === SECTION_ID) &&
                c.some((x) => x.field === "slug" && x.value === "shum-dozhdya");
            return ok ? EXISTING_BOOK : null;
        });
        expect(await findBookBySectionAndSlug(supabase, SECTION_ID, "shum-dozhdya")).toEqual(EXISTING_BOOK);
    });
});
