/**
 * Tests for chapter slug collision scoping rules:
 *
 *  1. Same chapter title in two different books → both get the base slug (no -N suffix).
 *  2. Duplicate chapter title within one book → second gets -2 suffix.
 *  3. Pre-existing chapter slug in the target book → new chapter with same title gets -2.
 *  4. Pre-existing chapter slug in a different book → target book chapter gets the base slug.
 *
 * Slug collision tracking is done with per-book in-memory Sets; no DB access needed here.
 * Scenarios 3 and 4 exercise that behaviour directly by pre-populating the Set.
 */

import { describe, it, expect } from "vitest";
import { slugify, findUniqueSuffix } from "../lib/slug.mjs";

/**
 * Mirrors the normalizeChapterSlug helper in migrate.mjs.
 * Assigns the next available slug for title within the given per-book Set.
 */
function assignSlug(title, usedSlugs) {
    const base = slugify(title);
    const slug = findUniqueSuffix(base, usedSlugs);
    usedSlugs.add(slug);
    return slug;
}

describe("chapter slug scope", () => {
    it("1. same title in two different books → both get the base slug", () => {
        const bookA = new Set();
        const bookB = new Set();

        const slugA = assignSlug("Глава 1", bookA);
        const slugB = assignSlug("Глава 1", bookB);

        expect(slugA).toBe("glava-1");
        expect(slugB).toBe("glava-1"); // must NOT be glava-1-2
    });

    it("2. duplicate title within the same book → second becomes base-2", () => {
        const usedSlugs = new Set();

        const first = assignSlug("Глава 1", usedSlugs);
        const second = assignSlug("Глава 1", usedSlugs);

        expect(first).toBe("glava-1");
        expect(second).toBe("glava-1-2");
    });

    it("3. existing chapter in the target book → collision produces suffix", () => {
        // Simulate target book that already has "glava-1" imported in DB.
        // The pre-population of usedSlugs from DB reflects this.
        const usedSlugs = new Set(["glava-1"]);

        const slug = assignSlug("Глава 1", usedSlugs);

        expect(slug).toBe("glava-1-2");
    });

    it("4. existing chapter in another book → does not affect target book slug", () => {
        // Another book has "glava-1" — tracked in a separate Set, never shared.
        const otherBook = new Set(["glava-1"]);  // noqa: used to document the other book's state
        const targetBook = new Set();

        const slug = assignSlug("Глава 1", targetBook);

        expect(slug).toBe("glava-1"); // otherBook's state has no effect
        void otherBook; // silence unused-variable lint
    });

    it("5. fix: extractedTitle that slugifies identically to link text gets same slug (no -2)", () => {
        // This documents the double-call bug fix in migrate.mjs.
        // If the extracted <h1> title "Пролог." is 1 char longer than link text "Пролог",
        // both slugify to "prolog". Without the fix, the second normalizeChapterSlug call
        // would find "prolog" already in usedSlugs and return "prolog-2".
        //
        // With the fix (delete provisional slug before re-slugging), the result stays "prolog".

        const usedSlugs = new Set();

        // Step 1: assign provisional slug from link text
        const provisionalBase = slugify("Пролог");       // "prolog"
        const provisional = findUniqueSuffix(provisionalBase, usedSlugs);
        usedSlugs.add(provisional);                       // usedSlugs = {"prolog"}

        // Step 2: extracted title is slightly longer but same base
        const extractedBase = slugify("Пролог.");         // also "prolog"

        // Fix: remove provisional before re-assigning
        usedSlugs.delete(provisional);                    // usedSlugs = {}
        const final = findUniqueSuffix(extractedBase, usedSlugs);
        usedSlugs.add(final);

        expect(provisional).toBe("prolog");
        expect(final).toBe("prolog"); // must NOT be "prolog-2"
    });
});
