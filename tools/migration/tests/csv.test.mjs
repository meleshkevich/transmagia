import { describe, it, expect } from "vitest";
import { parseCsv } from "../lib/csv.mjs";

describe("parseCsv", () => {
    it("parses a normal three-column row", () => {
        const csv = "title,url,section\nШум дождя,https://transmagia.house/shum/,originals";
        expect(parseCsv(csv)).toEqual([
            { title: "Шум дождя", url: "https://transmagia.house/shum/", section: "originals" },
        ]);
    });

    it("handles Cyrillic text in all fields", () => {
        const csv = "title,url,section\nГлавный герой,https://transmagia.house/main/,переводы";
        const [row] = parseCsv(csv);
        expect(row.title).toBe("Главный герой");
        expect(row.section).toBe("переводы");
    });

    it("parses a quoted title containing a comma", () => {
        const csv =
            'title,url,section\n"Как изменить отношение старшего? Приемы, позволяющие переломить ситуацию",https://transmagia.house/kak/,translations';
        const [row] = parseCsv(csv);
        expect(row.title).toBe(
            "Как изменить отношение старшего? Приемы, позволяющие переломить ситуацию"
        );
        expect(row.url).toBe("https://transmagia.house/kak/");
        expect(row.section).toBe("translations");
    });

    it("handles escaped double-quotes inside a quoted field", () => {
        const csv = 'title,url,section\n"She said ""Hello"" to me",https://example.com/,originals';
        const [row] = parseCsv(csv);
        expect(row.title).toBe('She said "Hello" to me');
    });

    it("skips rows where title or url is empty", () => {
        const csv = "title,url,section\n,https://example.com/,originals\nValid title,,originals";
        expect(parseCsv(csv)).toHaveLength(0);
    });

    it("throws or returns partial results for a row with wrong column count", () => {
        const csv = "title,url,section\nOnly one column";
        expect(() => parseCsv(csv)).toThrow();
    });
});
