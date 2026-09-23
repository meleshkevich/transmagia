import { describe, it, expect } from "vitest";
import { slugify, findUniqueSuffix } from "../lib/slug.mjs";

describe("slugify (migration tool — mirrors lib/slug.ts)", () => {
    it("produces the canonical slug for 'Шум дождя'", () => {
        expect(slugify("Шум дождя")).toBe("shum-dozhdya");
    });

    it("produces the correct slug for chapter 1 of Шум дождя", () => {
        expect(slugify("1. Жизнь — худшая из проявлений реальности")).toBe(
            "1-zhizn-khudshaya-iz-proyavleniy-realnosti"
        );
    });

    it("lowercases Latin input", () => {
        expect(slugify("Hello World")).toBe("hello-world");
    });

    it("replaces non-alphanumeric sequences with a single hyphen", () => {
        expect(slugify("Часть 2: Возвращение")).toBe("chast-2-vozvrashchenie");
    });

    it("strips leading and trailing hyphens", () => {
        expect(slugify("---test---")).toBe("test");
    });

    it("falls back to 'untitled' for empty/whitespace input", () => {
        expect(slugify("")).toBe("untitled");
        expect(slugify("   ")).toBe("untitled");
    });

    it("does NOT derive slug from WordPress URL (Cyrillic URL)", () => {
        // This test documents the invariant: slugify is called on TITLES, not URLs.
        const wpUrl = "https://transmagia.house/шум-дождя/";
        const titleSlug = slugify("Шум дождя");
        expect(titleSlug).not.toBe(wpUrl);
        expect(titleSlug).toBe("shum-dozhdya");
    });

    it("handles ё in context: after consonant → 'e', after vowel/start → 'yo'", () => {
        expect(slugify("Ёжик")).toBe("yozhik");
        expect(slugify("Ёлка")).toBe("yolka");
    });
});

describe("findUniqueSuffix", () => {
    it("returns the base slug when not in the used set", () => {
        expect(findUniqueSuffix("shum-dozhdya", new Set())).toBe("shum-dozhdya");
    });

    it("appends -2 for first collision", () => {
        expect(findUniqueSuffix("shum-dozhdya", new Set(["shum-dozhdya"]))).toBe("shum-dozhdya-2");
    });

    it("finds the next available suffix on multiple collisions", () => {
        const used = new Set(["glava", "glava-2", "glava-3"]);
        expect(findUniqueSuffix("glava", used)).toBe("glava-4");
    });
});
