import { describe, expect, it } from "vitest";
import { validateDisplayName, MAX_DISPLAY_NAME_LENGTH } from "./display-name-policy";

describe("validateDisplayName", () => {
    // ─── NULL / empty → store as NULL ────────────────────────────────────────────

    it("empty string → valid, normalizedValue null (stores NULL)", () => {
        const result = validateDisplayName("");
        expect(result).toEqual({ valid: true, normalizedValue: null });
    });

    it("whitespace-only string → valid, normalizedValue null (stores NULL)", () => {
        const result = validateDisplayName("   ");
        expect(result).toEqual({ valid: true, normalizedValue: null });
    });

    it("tab-only string → valid, normalizedValue null (stores NULL)", () => {
        const result = validateDisplayName("\t");
        expect(result).toEqual({ valid: true, normalizedValue: null });
    });

    // ─── Leading/trailing whitespace is trimmed ───────────────────────────────────

    it("name with leading spaces is trimmed", () => {
        const result = validateDisplayName("  Алекс");
        expect(result).toEqual({ valid: true, normalizedValue: "Алекс" });
    });

    it("name with trailing spaces is trimmed", () => {
        const result = validateDisplayName("Алекс  ");
        expect(result).toEqual({ valid: true, normalizedValue: "Алекс" });
    });

    it("name with both leading and trailing spaces is trimmed", () => {
        const result = validateDisplayName("  Алекс  ");
        expect(result).toEqual({ valid: true, normalizedValue: "Алекс" });
    });

    // ─── Cyrillic and Latin names are accepted ────────────────────────────────────

    it("Cyrillic name is accepted", () => {
        const result = validateDisplayName("Алекс");
        expect(result).toEqual({ valid: true, normalizedValue: "Алекс" });
    });

    it("Latin name is accepted", () => {
        const result = validateDisplayName("Alex");
        expect(result).toEqual({ valid: true, normalizedValue: "Alex" });
    });

    it("mixed Cyrillic and Latin name is accepted", () => {
        const result = validateDisplayName("Алекс Alex");
        expect(result).toEqual({ valid: true, normalizedValue: "Алекс Alex" });
    });

    it("Unicode name with diacritics is accepted", () => {
        const result = validateDisplayName("José");
        expect(result).toEqual({ valid: true, normalizedValue: "José" });
    });

    it("name with internal spaces is accepted", () => {
        const result = validateDisplayName("Иван Петров");
        expect(result).toEqual({ valid: true, normalizedValue: "Иван Петров" });
    });

    // ─── Length validation ────────────────────────────────────────────────────────

    it("name at exactly max length is accepted", () => {
        const name = "А".repeat(MAX_DISPLAY_NAME_LENGTH);
        const result = validateDisplayName(name);
        expect(result).toEqual({ valid: true, normalizedValue: name });
    });

    it("name one character over max length is rejected", () => {
        const name = "А".repeat(MAX_DISPLAY_NAME_LENGTH + 1);
        const result = validateDisplayName(name);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.error).toMatch(/40/);
        }
    });

    it("name trimmed to exactly max length is accepted", () => {
        const name = " " + "А".repeat(MAX_DISPLAY_NAME_LENGTH) + " ";
        const result = validateDisplayName(name);
        expect(result).toEqual({ valid: true, normalizedValue: "А".repeat(MAX_DISPLAY_NAME_LENGTH) });
    });

    it("name trimmed to over max length is rejected", () => {
        const name = " " + "А".repeat(MAX_DISPLAY_NAME_LENGTH + 1) + " ";
        const result = validateDisplayName(name);
        expect(result.valid).toBe(false);
    });

    // ─── Control characters are rejected ─────────────────────────────────────────

    it("name with null byte is rejected", () => {
        const result = validateDisplayName("Алекс\x00");
        expect(result.valid).toBe(false);
    });

    it("name with BEL control char is rejected", () => {
        const result = validateDisplayName("Алекс\x07");
        expect(result.valid).toBe(false);
    });

    it("name with DEL control char is rejected", () => {
        const result = validateDisplayName("Алекс\x7F");
        expect(result.valid).toBe(false);
    });

    it("name with vertical tab is rejected", () => {
        const result = validateDisplayName("Алекс\x0B");
        expect(result.valid).toBe(false);
    });

    it("name with form feed is rejected", () => {
        const result = validateDisplayName("Алекс\x0C");
        expect(result.valid).toBe(false);
    });

    // ─── Valid normal inputs ──────────────────────────────────────────────────────

    it("short name 'Читатель' is accepted", () => {
        const result = validateDisplayName("Читатель");
        expect(result).toEqual({ valid: true, normalizedValue: "Читатель" });
    });

    it("single character name is accepted", () => {
        const result = validateDisplayName("А");
        expect(result).toEqual({ valid: true, normalizedValue: "А" });
    });

    it("name with numbers is accepted", () => {
        const result = validateDisplayName("User123");
        expect(result).toEqual({ valid: true, normalizedValue: "User123" });
    });
});
