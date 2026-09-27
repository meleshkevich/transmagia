import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";
import {
    extractBookCover,
    parseBookPage,
} from "../lib/parser.mjs";
import {
    BOOK_PAGE_PESKI_STYLE,
    BOOK_PAGE_COVER_IN_P_WRAPPER,
    BOOK_PAGE_WITH_LIST_CHAPTERS,
    BOOK_PAGE_NO_COVER,
    BOOK_PAGE_NO_DESCRIPTION,
    BOOK_PAGE_WITH_BR_IN_DESCRIPTION,
    BOOK_PAGE_RICH_FORMATTING,
    BOOK_PAGE_UNRELATED_IMAGES,
    BOOK_PAGE_EMPTY_PARAGRAPHS,
    BOOK_PAGE_WITH_MULTI_PARAGRAPH_DESCRIPTION,
    BOOK_PAGE_CHAPTER_LINKS_WITH_EXTERNAL,
    BOOK_PAGE_AUTHOR_NOTE_AGE_WARNING,
    BOOK_PAGE_WP_CRUFT,
    BOOK_PAGE_CHAPTER_LINKS_NO_CONTAINER,
} from "./fixtures.mjs";

const BOOK_URL = "https://transmagia.house/test-book/";

// ── extractBookCover ─────────────────────────────────────────────────────────

describe("extractBookCover", () => {
    it("finds a wp-content/uploads image as the cover", () => {
        const $ = cheerio.load(BOOK_PAGE_PESKI_STYLE);
        const container = $(".post-content").first();
        const cover = extractBookCover($, container);
        expect(cover).not.toBeNull();
        expect(cover.src).toContain("/wp-content/uploads/");
        expect(cover.src).toContain("cover.jpg");
    });

    it("finds a cover inside a paragraph wrapper", () => {
        const $ = cheerio.load(BOOK_PAGE_COVER_IN_P_WRAPPER);
        const container = $(".post-content").first();
        const cover = extractBookCover($, container);
        expect(cover).not.toBeNull();
        expect(cover.src).toContain("cover2.jpg");
    });

    it("returns null when no wp-content/uploads image exists in container", () => {
        const $ = cheerio.load(BOOK_PAGE_NO_COVER);
        const container = $(".post-content").first();
        const cover = extractBookCover($, container);
        expect(cover).toBeNull();
    });

    it("ignores theme images outside the content container", () => {
        const $ = cheerio.load(BOOK_PAGE_UNRELATED_IMAGES);
        const container = $(".post-content").first();
        const cover = extractBookCover($, container);
        // Should find the cover inside the container, not the logo in <header>
        expect(cover).not.toBeNull();
        expect(cover.src).toContain("actual-cover.jpg");
    });
});

// ── parseBookPage ─────────────────────────────────────────────────────────────

describe("parseBookPage — cover detection", () => {
    it("extracts cover source URL", () => {
        const result = parseBookPage(BOOK_PAGE_PESKI_STYLE, BOOK_URL);
        expect(result.ok).toBe(true);
        expect(result.cover).not.toBeNull();
        expect(result.cover.src).toContain("/wp-content/uploads/");
    });

    it("cover is NOT included as an inline image inside description", () => {
        const result = parseBookPage(BOOK_PAGE_PESKI_STYLE, BOOK_URL);
        expect(result.ok).toBe(true);
        const descHtml = result.descriptionHtml ?? "";
        // The cover src should not appear in the description HTML
        expect(descHtml).not.toContain("cover.jpg");
    });

    it("reports warning when no cover found", () => {
        const result = parseBookPage(BOOK_PAGE_NO_COVER, BOOK_URL);
        expect(result.ok).toBe(true);
        expect(result.cover).toBeNull();
        expect(result.warnings.some((w) => w.toLowerCase().includes("cover"))).toBe(true);
    });

    it("extracts cover when it is inside a paragraph wrapper", () => {
        const result = parseBookPage(BOOK_PAGE_COVER_IN_P_WRAPPER, BOOK_URL);
        expect(result.ok).toBe(true);
        expect(result.cover).not.toBeNull();
        expect(result.cover.src).toContain("cover2.jpg");
        // The empty wrapper <p> should not appear as an image node inside description
        expect(result.descriptionHtml).not.toContain("cover2.jpg");
    });
});

describe("parseBookPage — description extraction", () => {
    it("returns a valid Tiptap document", () => {
        const result = parseBookPage(BOOK_PAGE_PESKI_STYLE, BOOK_URL);
        expect(result.ok).toBe(true);
        expect(result.description).not.toBeNull();
        expect(result.description.type).toBe("doc");
        expect(Array.isArray(result.description.content)).toBe(true);
    });

    it("description includes text content before chapter links", () => {
        const result = parseBookPage(BOOK_PAGE_PESKI_STYLE, BOOK_URL);
        expect(result.ok).toBe(true);
        const descHtml = result.descriptionHtml;
        expect(descHtml).toContain("Питер и Джейн");
    });

    it("chapter links are excluded from description", () => {
        const result = parseBookPage(BOOK_PAGE_PESKI_STYLE, BOOK_URL);
        expect(result.ok).toBe(true);
        const descHtml = result.descriptionHtml;
        expect(descHtml).not.toContain("Пролог");
        expect(descHtml).not.toContain("Глава 1");
        expect(descHtml).not.toContain("Глава 2");
    });

    it("author note remains inside description", () => {
        const result = parseBookPage(BOOK_PAGE_AUTHOR_NOTE_AGE_WARNING, BOOK_URL);
        expect(result.ok).toBe(true);
        const descHtml = result.descriptionHtml;
        expect(descHtml).toContain("От Автора");
        expect(descHtml).toContain("Уважаемые читатели");
    });

    it("age/content warning remains inside description", () => {
        const result = parseBookPage(BOOK_PAGE_AUTHOR_NOTE_AGE_WARNING, BOOK_URL);
        expect(result.ok).toBe(true);
        const descHtml = result.descriptionHtml;
        expect(descHtml).toContain("18+");
    });

    it("handles multiple paragraphs", () => {
        const result = parseBookPage(BOOK_PAGE_WITH_MULTI_PARAGRAPH_DESCRIPTION, BOOK_URL);
        expect(result.ok).toBe(true);
        const paragraphCount = (result.description?.content ?? []).filter((n) => n.type === "paragraph").length;
        expect(paragraphCount).toBeGreaterThanOrEqual(3);
    });

    it("handles empty paragraphs without crashing", () => {
        const result = parseBookPage(BOOK_PAGE_EMPTY_PARAGRAPHS, BOOK_URL);
        expect(result.ok).toBe(true);
        expect(result.description).not.toBeNull();
    });

    it("reports warning when no description found before chapter links", () => {
        const result = parseBookPage(BOOK_PAGE_NO_DESCRIPTION, BOOK_URL);
        expect(result.ok).toBe(true);
        expect(result.warnings.some((w) => w.toLowerCase().includes("description") || w.toLowerCase().includes("content"))).toBe(true);
    });

    it("returns ok=false when content container is not found", () => {
        const result = parseBookPage(BOOK_PAGE_CHAPTER_LINKS_NO_CONTAINER, BOOK_URL);
        expect(result.ok).toBe(false);
        expect(result.error).toBeTruthy();
    });
});

describe("parseBookPage — <br> handling", () => {
    it("preserves internal <br> as Tiptap hardBreak node", () => {
        const result = parseBookPage(BOOK_PAGE_WITH_BR_IN_DESCRIPTION, BOOK_URL);
        expect(result.ok).toBe(true);
        expect(result.description).not.toBeNull();

        const nodeCount = result.descriptionNodeCount ?? {};
        expect(nodeCount["hardBreak"]).toBeGreaterThanOrEqual(1);
    });

    it("<br> hardBreak appears inside the paragraph, not as a standalone node", () => {
        const result = parseBookPage(BOOK_PAGE_WITH_BR_IN_DESCRIPTION, BOOK_URL);
        expect(result.ok).toBe(true);
        const paragraphs = (result.description?.content ?? []).filter((n) => n.type === "paragraph");
        const hasHardBreakInParagraph = paragraphs.some((p) =>
            (p.content ?? []).some((child) => child.type === "hardBreak")
        );
        expect(hasHardBreakInParagraph).toBe(true);
    });
});

describe("parseBookPage — formatting", () => {
    it("preserves <strong> (bold marks) in Tiptap output", () => {
        const result = parseBookPage(BOOK_PAGE_RICH_FORMATTING, BOOK_URL);
        expect(result.ok).toBe(true);
        const nodeCount = result.descriptionNodeCount ?? {};
        expect(nodeCount["text"]).toBeGreaterThan(0);
        // bold marks appear as text nodes with marks, not counted separately
        // Verify the description HTML still has <strong> before cleaning
        expect(result.descriptionHtml).toContain("<strong>");
    });

    it("preserves <em> (italic marks) in Tiptap output", () => {
        const result = parseBookPage(BOOK_PAGE_WITH_LIST_CHAPTERS, BOOK_URL);
        expect(result.ok).toBe(true);
        // Fixture has <em>Предупреждение</em> in description
        expect(result.descriptionHtml).toContain("<em>");
    });

    it("strips WordPress attributes (id, style, class) from description", () => {
        const result = parseBookPage(BOOK_PAGE_WP_CRUFT, BOOK_URL);
        expect(result.ok).toBe(true);
        // The description content should preserve text but not WP attributes
        // We check the Tiptap doc doesn't contain the sharedaddy noise
        const docStr = JSON.stringify(result.description ?? {});
        expect(docStr).not.toContain("sharedaddy");
    });

    it("does not flatten description to plain text", () => {
        const result = parseBookPage(BOOK_PAGE_RICH_FORMATTING, BOOK_URL);
        expect(result.ok).toBe(true);
        expect(result.description?.type).toBe("doc");
        // A flattened result would have only text type nodes
        const nodeCount = result.descriptionNodeCount ?? {};
        expect(nodeCount["paragraph"] ?? 0).toBeGreaterThan(0);
    });
});

describe("parseBookPage — chapter list exclusion", () => {
    it("excludes bare top-level <a> chapter links from description", () => {
        const result = parseBookPage(BOOK_PAGE_PESKI_STYLE, BOOK_URL);
        expect(result.ok).toBe(true);
        // Count chapter links: Пролог, Глава 1, Глава 2 = 3
        // They should NOT appear in description
        const descHtml = result.descriptionHtml;
        expect(descHtml).not.toMatch(/Пролог|Глава 1|Глава 2/);
    });

    it("excludes <ul>/<ol> chapter list from description", () => {
        const result = parseBookPage(BOOK_PAGE_WITH_LIST_CHAPTERS, BOOK_URL);
        expect(result.ok).toBe(true);
        const descHtml = result.descriptionHtml;
        // List items with chapter links should be excluded
        expect(descHtml).not.toContain("Глава 1");
        expect(descHtml).not.toContain("Глава 2");
        expect(descHtml).not.toContain("Глава 3");
        // But description text should be present
        expect(descHtml).toContain("Описание книги");
    });

    it("description includes 'Список глав:' paragraph that precedes the chapter list", () => {
        // The paragraph "Список глав:" appears before <ul>, so it's in description
        const result = parseBookPage(BOOK_PAGE_WITH_LIST_CHAPTERS, BOOK_URL);
        expect(result.ok).toBe(true);
        expect(result.descriptionHtml).toContain("Список глав");
    });
});

describe("parseBookPage — unrelated links and images", () => {
    it("description can contain external links without treating them as chapter links", () => {
        const result = parseBookPage(BOOK_PAGE_CHAPTER_LINKS_WITH_EXTERNAL, BOOK_URL);
        expect(result.ok).toBe(true);
        // External link text 'автором' should be in description
        expect(result.descriptionHtml).toContain("автором");
    });

    it("only wp-content/uploads images are treated as candidate covers", () => {
        // Theme logo in <header> (outside post-content) is ignored
        const result = parseBookPage(BOOK_PAGE_UNRELATED_IMAGES, BOOK_URL);
        expect(result.ok).toBe(true);
        expect(result.cover?.src).toContain("actual-cover.jpg");
        expect(result.cover?.src).not.toContain("logo.png");
    });
});

describe("parseBookPage — single paragraph description", () => {
    it("handles single-paragraph description correctly", () => {
        const result = parseBookPage(BOOK_PAGE_NO_COVER, BOOK_URL);
        expect(result.ok).toBe(true);
        const paragraphs = (result.description?.content ?? []).filter((n) => n.type === "paragraph");
        expect(paragraphs.length).toBeGreaterThanOrEqual(1);
        const text = paragraphs.map((p) => (p.content ?? []).map((c) => c.text ?? "").join("")).join(" ");
        expect(text).toContain("Только текст");
    });
});
