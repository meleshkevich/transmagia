// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { isInsideProtected, isSelectionInsideProtected, shouldBlockKey } from "./copy-guard";

describe("isInsideProtected", () => {
    it("returns true when target is a child of the protected element", () => {
        const guard = document.createElement("div");
        const child = document.createElement("p");
        guard.appendChild(child);
        expect(isInsideProtected(child, guard)).toBe(true);
    });

    it("returns true when target is a text node inside the protected element", () => {
        const guard = document.createElement("div");
        const text = document.createTextNode("hello");
        guard.appendChild(text);
        expect(isInsideProtected(text, guard)).toBe(true);
    });

    it("returns false when target is outside the protected element", () => {
        const guard = document.createElement("div");
        const outside = document.createElement("textarea");
        expect(isInsideProtected(outside, guard)).toBe(false);
    });

    it("returns false when target is null", () => {
        const guard = document.createElement("div");
        expect(isInsideProtected(null, guard)).toBe(false);
    });

    it("returns false when the protected element is null", () => {
        const node = document.createElement("p");
        expect(isInsideProtected(node, null)).toBe(false);
    });

    it("comment textarea is outside the guard → allowed", () => {
        const guard = document.createElement("div");
        const textarea = document.createElement("textarea");
        // textarea lives in comments section, not inside guard
        expect(isInsideProtected(textarea, guard)).toBe(false);
    });
});

describe("isSelectionInsideProtected", () => {
    it("returns true when selection anchorNode is inside the protected element", () => {
        const guard = document.createElement("div");
        const child = document.createTextNode("chapter text");
        guard.appendChild(child);
        const fakeSel = { isCollapsed: false, anchorNode: child } as unknown as Selection;
        expect(isSelectionInsideProtected(fakeSel, guard)).toBe(true);
    });

    it("returns false when selection anchorNode is outside the protected element", () => {
        const guard = document.createElement("div");
        const outside = document.createTextNode("comment");
        const fakeSel = { isCollapsed: false, anchorNode: outside } as unknown as Selection;
        expect(isSelectionInsideProtected(fakeSel, guard)).toBe(false);
    });

    it("returns false when selection is collapsed", () => {
        const guard = document.createElement("div");
        const child = document.createTextNode("text");
        guard.appendChild(child);
        const fakeSel = { isCollapsed: true, anchorNode: child } as unknown as Selection;
        expect(isSelectionInsideProtected(fakeSel, guard)).toBe(false);
    });

    it("returns false when selection is null", () => {
        const guard = document.createElement("div");
        expect(isSelectionInsideProtected(null, guard)).toBe(false);
    });

    it("returns false when anchorNode is null", () => {
        const guard = document.createElement("div");
        const fakeSel = { isCollapsed: false, anchorNode: null } as unknown as Selection;
        expect(isSelectionInsideProtected(fakeSel, guard)).toBe(false);
    });
});

describe("shouldBlockKey", () => {
    it("blocks c (Ctrl/Cmd+C → copy)", () => {
        expect(shouldBlockKey("c")).toBe(true);
    });

    it("blocks a (Ctrl/Cmd+A → select all)", () => {
        expect(shouldBlockKey("a")).toBe(true);
    });

    it("blocks x, s, p, u", () => {
        for (const k of ["x", "s", "p", "u"]) {
            expect(shouldBlockKey(k)).toBe(true);
        }
    });

    it("allows an unrelated shortcut (z → undo)", () => {
        expect(shouldBlockKey("z")).toBe(false);
    });

    it("is case-insensitive", () => {
        expect(shouldBlockKey("C")).toBe(true);
        expect(shouldBlockKey("A")).toBe(true);
    });
});
