import { describe, it, expect } from "vitest";
import { extractTiptapText, truncateDescription } from "./tiptap-text";

// ── extractTiptapText ─────────────────────────────────────────────────────────

const para = (text: string) => ({
    type: "paragraph",
    content: [{ type: "text", text }],
});

const empty = { type: "doc", content: [] };
const emptyPara = { type: "doc", content: [{ type: "paragraph" }] };

describe("extractTiptapText", () => {
    it("returns empty string for an empty document", () => {
        expect(extractTiptapText(empty)).toBe("");
    });

    it("returns empty string for a document with an empty paragraph", () => {
        expect(extractTiptapText(emptyPara)).toBe("");
    });

    it("extracts text from a single paragraph", () => {
        const doc = { type: "doc", content: [para("Hello world")] };
        expect(extractTiptapText(doc)).toBe("Hello world");
    });

    it("joins multiple paragraphs with a space so they do not run together", () => {
        const doc = { type: "doc", content: [para("First."), para("Second.")] };
        expect(extractTiptapText(doc)).toBe("First. Second.");
    });

    it("extracts text from a heading node", () => {
        const doc = {
            type: "doc",
            content: [
                { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Title" }] },
                para("Body text."),
            ],
        };
        expect(extractTiptapText(doc)).toBe("Title Body text.");
    });

    it("handles hardBreak as a space", () => {
        const doc = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: "Line one" },
                        { type: "hardBreak" },
                        { type: "text", text: "Line two" },
                    ],
                },
            ],
        };
        expect(extractTiptapText(doc)).toBe("Line one Line two");
    });

    it("extracts text from nested list items", () => {
        const doc = {
            type: "doc",
            content: [
                {
                    type: "bulletList",
                    content: [
                        { type: "listItem", content: [para("First")] },
                        { type: "listItem", content: [para("Second")] },
                    ],
                },
            ],
        };
        // listItem is a block type and adds a trailing space; normalisation collapses duplicates
        const result = extractTiptapText(doc);
        expect(result).toContain("First");
        expect(result).toContain("Second");
    });

    it("collapses multiple internal whitespace characters", () => {
        const doc = {
            type: "doc",
            content: [
                { type: "paragraph", content: [{ type: "text", text: "   spaced   " }] },
            ],
        };
        expect(extractTiptapText(doc)).toBe("spaced");
    });

    it("handles bold/italic marks transparently (marks are not in this type)", () => {
        const doc = {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: "bold text", marks: [{ type: "bold" }] },
                        { type: "text", text: " normal" },
                    ],
                },
            ],
        };
        expect(extractTiptapText(doc)).toBe("bold text normal");
    });
});

// ── truncateDescription ───────────────────────────────────────────────────────

describe("truncateDescription", () => {
    it("returns the original string if at or below the limit", () => {
        expect(truncateDescription("Short text", 320)).toBe("Short text");
        expect(truncateDescription("Exactly", 7)).toBe("Exactly");
    });

    it("appends … when truncating", () => {
        const result = truncateDescription("Hello world", 8);
        expect(result).toMatch(/…$/);
    });

    it("backs up to a word boundary rather than cutting mid-word", () => {
        // Limit 8 cuts through "world" (Hello wo); last space is at index 5 → "Hello"
        expect(truncateDescription("Hello world", 8)).toBe("Hello…");
    });

    it("falls back to a hard cut when there is no space within the limit", () => {
        const result = truncateDescription("superlongwordwithoutspaces", 10);
        expect(result).toBe("superlongw…");
    });

    it("trims trailing whitespace before appending …", () => {
        // "Hello " up to limit 6 → "Hello " trimEnd → "Hello" + "…"
        expect(truncateDescription("Hello world", 6)).toBe("Hello…");
    });

    it("handles exactly limit+1 length input", () => {
        const text = "a".repeat(321);
        const result = truncateDescription(text, 320);
        expect(result.length).toBeLessThanOrEqual(322); // 320 chars + "…"
        expect(result).toMatch(/…$/);
    });
});
