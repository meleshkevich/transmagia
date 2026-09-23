import { describe, it, expect } from "vitest";
import {
    extractChapterLinks,
    parseChapterHtml,
    cleanWordPressContent,
    extractImages,
} from "../lib/parser.mjs";
import * as cheerio from "cheerio";
import {
    BOOK_PAGE_WITH_CHAPTER_LINKS,
    BOOK_PAGE_WITH_UNRELATED_LINKS,
    BOOK_PAGE_NO_CONTENT,
    CHAPTER_PAGE_NORMAL,
    CHAPTER_PAGE_WITH_IMAGES,
    CHAPTER_PAGE_NO_CONTENT_CONTAINER,
    CHAPTER_PAGE_MALFORMED_HTML,
    CHAPTER_PAGE_WP_CRUFT,
} from "./fixtures.mjs";

const BOOK_URL = "https://transmagia.house/shum-dozhdya/";

describe("extractChapterLinks", () => {
    it("extracts chapter links from book page content area", () => {
        const links = extractChapterLinks(BOOK_PAGE_WITH_CHAPTER_LINKS, BOOK_URL);
        expect(links).toHaveLength(3);
        expect(links[0].href).toContain("1-zhizn");
        expect(links[0].text).toBe("1. Жизнь — худшая из проявлений реальности");
        expect(links[1].text).toBe("2. Сон");
        expect(links[2].text).toBe("3. Утро");
    });

    it("preserves chapter link order", () => {
        const links = extractChapterLinks(BOOK_PAGE_WITH_CHAPTER_LINKS, BOOK_URL);
        expect(links[0].text).toMatch(/^1\./);
        expect(links[1].text).toMatch(/^2\./);
        expect(links[2].text).toMatch(/^3\./);
    });

    it("excludes external domain links", () => {
        const links = extractChapterLinks(BOOK_PAGE_WITH_UNRELATED_LINKS, BOOK_URL);
        const external = links.filter((l) => !l.href.startsWith("https://transmagia.house"));
        expect(external).toHaveLength(0);
    });

    it("excludes category and author links", () => {
        const links = extractChapterLinks(BOOK_PAGE_WITH_UNRELATED_LINKS, BOOK_URL);
        const categoryOrAuthor = links.filter(
            (l) => l.href.includes("/category/") || l.href.includes("/author/")
        );
        expect(categoryOrAuthor).toHaveLength(0);
    });

    it("returns chapter content links only (not nav/external)", () => {
        const links = extractChapterLinks(BOOK_PAGE_WITH_UNRELATED_LINKS, BOOK_URL);
        expect(links.length).toBeGreaterThanOrEqual(2);
        expect(links.every((l) => l.href.includes("transmagia.house"))).toBe(true);
    });

    it("deduplicates chapter links", () => {
        const html = `<html><body><article><div class="post-content">
          <a href="https://transmagia.house/ch1/">Глава 1</a>
          <a href="https://transmagia.house/ch1/">Глава 1 (дубль)</a>
          <a href="https://transmagia.house/ch2/">Глава 2</a>
        </div></article></body></html>`;
        const links = extractChapterLinks(html, BOOK_URL);
        const urls = links.map((l) => l.href);
        expect(new Set(urls).size).toBe(urls.length);
    });

    it("returns empty array when no content container found", () => {
        const links = extractChapterLinks(BOOK_PAGE_NO_CONTENT, BOOK_URL);
        expect(links).toHaveLength(0);
    });
});

describe("parseChapterHtml", () => {
    it("successfully parses a normal chapter page", () => {
        const result = parseChapterHtml(CHAPTER_PAGE_NORMAL);
        expect(result.ok).toBe(true);
        expect(result.content).toBeDefined();
        expect(result.content.type).toBe("doc");
        expect(result.pageTitle).toBeTruthy();
        expect(result.extractedTitle).toContain("Жизнь");
        expect(result.sourcePostId).toBe(12345);
    });

    it("rawHtml is captured BEFORE cleaning (different from cleanedHtml when WP cruft exists)", () => {
        const result = parseChapterHtml(CHAPTER_PAGE_WP_CRUFT);
        expect(result.ok).toBe(true);
        // rawHtml should still contain id, style attributes (not cleaned yet)
        expect(result.rawHtml).toMatch(/id="keep-text"|style=|class=/);
        // cleanedHtml should have those stripped
        expect(result.cleanedHtml).not.toMatch(/id="keep-text"/);
        expect(result.cleanedHtml).not.toMatch(/style=/);
    });

    it("rawHtml and cleanedHtml are different strings when WP elements exist", () => {
        const result = parseChapterHtml(CHAPTER_PAGE_WP_CRUFT);
        expect(result.ok).toBe(true);
        // rawHtml contains WP noise; cleanedHtml is stripped
        expect(result.rawHtml).not.toBe(result.cleanedHtml);
    });

    it("returns error when content container not found", () => {
        const result = parseChapterHtml(CHAPTER_PAGE_NO_CONTENT_CONTAINER);
        expect(result.ok).toBe(false);
        expect(result.error).toBeTruthy();
    });

    it("handles malformed HTML without throwing", () => {
        expect(() => parseChapterHtml(CHAPTER_PAGE_MALFORMED_HTML)).not.toThrow();
        const result = parseChapterHtml(CHAPTER_PAGE_MALFORMED_HTML);
        // Either ok (Cheerio fixed it) or error — must not throw
        expect(typeof result.ok).toBe("boolean");
    });

    it("extracts images from chapter page", () => {
        const result = parseChapterHtml(CHAPTER_PAGE_WITH_IMAGES);
        expect(result.ok).toBe(true);
        expect(result.images).toHaveLength(1);
        expect(result.images[0]).toContain("illustration.jpg");
    });

    it("returns empty images array when no images present", () => {
        const result = parseChapterHtml(CHAPTER_PAGE_NORMAL);
        expect(result.ok).toBe(true);
        expect(result.images).toHaveLength(0);
    });
});

describe("cleanWordPressContent", () => {
    it("removes WordPress navigation, comments, and scripts", () => {
        const $ = cheerio.load(CHAPTER_PAGE_WP_CRUFT);
        const container = $(".post-content").first();
        const cleaned = cleanWordPressContent($, container);
        expect(cleaned).not.toMatch(/sharedaddy|jp-relatedposts|<nav|<script|<style/i);
    });

    it("strips id, style, class, data-id attributes", () => {
        const $ = cheerio.load(CHAPTER_PAGE_WP_CRUFT);
        const container = $(".post-content").first();
        const cleaned = cleanWordPressContent($, container);
        expect(cleaned).not.toMatch(/id="|style="|class="|data-id="/);
    });

    it("preserves text content after cleaning", () => {
        const $ = cheerio.load(CHAPTER_PAGE_WP_CRUFT);
        const container = $(".post-content").first();
        const cleaned = cleanWordPressContent($, container);
        expect(cleaned).toContain("Основной текст.");
    });
});

describe("extractImages", () => {
    it("returns image src URLs from container", () => {
        const $ = cheerio.load(CHAPTER_PAGE_WITH_IMAGES);
        const container = $(".post-content").first();
        const images = extractImages($, container);
        expect(images).toHaveLength(1);
        expect(images[0]).toBe("https://transmagia.house/wp-content/uploads/illustration.jpg");
    });

    it("returns empty array when no images", () => {
        const $ = cheerio.load(CHAPTER_PAGE_NORMAL);
        const container = $(".post-content").first();
        const images = extractImages($, container);
        expect(images).toHaveLength(0);
    });

    it("falls back to data-src attribute", () => {
        const html = `<html><body><article><div class="post-content">
          <img data-src="https://example.com/lazy.jpg" alt="lazy">
        </div></article></body></html>`;
        const $ = cheerio.load(html);
        const container = $(".post-content").first();
        const images = extractImages($, container);
        expect(images[0]).toContain("lazy.jpg");
    });
});
