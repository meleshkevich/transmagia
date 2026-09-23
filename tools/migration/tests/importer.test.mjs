import { describe, it, expect } from "vitest";
import { findChapterByLegacyUrl, findChapterByWpId } from "../lib/importer.mjs";

// Minimal Supabase mock that supports .from().select().eq().maybeSingle()
function makeSupabaseMock({ byUrl = null, byWpId = null } = {}) {
    return {
        from: () => ({
            select: () => ({
                eq: (field) => ({
                    maybeSingle: async () => ({
                        data: field === "legacy_url" ? byUrl : field === "legacy_wp_id" ? byWpId : null,
                        error: null,
                    }),
                }),
            }),
        }),
    };
}

function makeErrorSupabase(message) {
    return {
        from: () => ({
            select: () => ({
                eq: () => ({
                    maybeSingle: async () => ({ data: null, error: new Error(message) }),
                }),
            }),
        }),
    };
}

const EXISTING = {
    id: "d0ef4b8d-524b-4bb8-8e41-d8324494ecba",
    title: "1. Жизнь — худшая из проявлений реальности",
    status: "draft",
    legacy_url: "https://transmagia.house/1-%D0%B6%D0%B8%D0%B7%D0%BD%D1%8C-%D1%85%D1%83%D0%B4%D1%88%D0%B0%D1%8F-%D0%B8%D0%B7-%D0%BF%D1%80%D0%BE%D1%8F%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B9-%D1%80%D0%B5%D0%B0%D0%BB%D1%8C%D0%BD%D0%BE%D1%81/",
    legacy_wp_id: 198,
    book_id: "book-uuid-shum-dozhdya",
};

describe("duplicate chapter detection — combined scenarios", () => {
    it("scenario 1: same WP ID + different URL → existing record detected via wp_id", async () => {
        // The chapter URL changed on WordPress; the WP post ID is the reliable key.
        const supabase = makeSupabaseMock({ byUrl: null, byWpId: EXISTING });

        // Early URL check: misses because slug changed
        const byUrl = await findChapterByLegacyUrl(supabase, "https://transmagia.house/different-slug/");
        expect(byUrl).toBeNull();

        // Post-parse WP ID check: hits
        const byWpId = await findChapterByWpId(supabase, 198);
        expect(byWpId).toEqual(EXISTING);
    });

    it("scenario 2: same URL + same WP ID → existing record detected via url (early skip)", async () => {
        // URL check fires first; the chapter is identified without needing to parse the page.
        const supabase = makeSupabaseMock({ byUrl: EXISTING, byWpId: EXISTING });

        const byUrl = await findChapterByLegacyUrl(supabase, EXISTING.legacy_url);
        expect(byUrl).toEqual(EXISTING);
        // WP ID check would not be reached because the early URL skip fires first.
    });

    it("scenario 3: different WP ID + different URL → new entity (neither check hits)", async () => {
        const supabase = makeSupabaseMock({ byUrl: null, byWpId: null });

        const byUrl = await findChapterByLegacyUrl(supabase, "https://transmagia.house/brand-new-chapter/");
        expect(byUrl).toBeNull();

        const byWpId = await findChapterByWpId(supabase, 9999);
        expect(byWpId).toBeNull();
    });

    it("scenario 4: no WP ID → fallback to legacy_url only", async () => {
        // Source post has no postid-NNN body class; URL is the only identifier.
        const existingNoWpId = { ...EXISTING, legacy_wp_id: null };
        const supabase = makeSupabaseMock({ byUrl: existingNoWpId, byWpId: null });

        const byUrl = await findChapterByLegacyUrl(supabase, existingNoWpId.legacy_url);
        expect(byUrl).toEqual(existingNoWpId);

        // When legacyWpId is null, the WP ID check is skipped entirely in processBook.
    });
});

describe("findChapterByLegacyUrl", () => {
    it("returns null when no chapter has the given URL", async () => {
        const supabase = makeSupabaseMock({ byUrl: null });
        const result = await findChapterByLegacyUrl(supabase, "https://transmagia.house/unknown/");
        expect(result).toBeNull();
    });

    it("returns the chapter record when URL matches", async () => {
        const supabase = makeSupabaseMock({ byUrl: EXISTING });
        const result = await findChapterByLegacyUrl(supabase, EXISTING.legacy_url);
        expect(result).toEqual(EXISTING);
    });

    it("throws when Supabase returns an error", async () => {
        const supabase = makeErrorSupabase("DB connection failed");
        await expect(findChapterByLegacyUrl(supabase, "https://x.com/")).rejects.toThrow("DB connection failed");
    });
});

describe("findChapterByWpId", () => {
    it("returns null when no chapter has the given WP ID", async () => {
        const supabase = makeSupabaseMock({ byWpId: null });
        const result = await findChapterByWpId(supabase, 9999);
        expect(result).toBeNull();
    });

    it("returns the chapter record when WP ID matches", async () => {
        const supabase = makeSupabaseMock({ byWpId: EXISTING });
        const result = await findChapterByWpId(supabase, 198);
        expect(result).toEqual(EXISTING);
    });

    it("throws when Supabase returns an error", async () => {
        const supabase = makeErrorSupabase("DB connection failed");
        await expect(findChapterByWpId(supabase, 198)).rejects.toThrow("DB connection failed");
    });
});
