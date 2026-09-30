import { parse } from "csv-parse/sync";

/**
 * Parse migration CSV content (title,url,section) into row objects.
 * Handles: quoted fields, commas inside quotes, escaped double-quotes (""),
 * UTF-8 / Cyrillic text, and optional BOM.
 *
 * @param {string} content - raw UTF-8 CSV text
 * @returns {{ title: string, url: string, section: string }[]}
 */
export function parseCsv(content) {
    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
    });

    return records
        .filter((r) => r.title && r.url)
        .map((r) => ({
            title: r.title,
            url: r.url,
            section: r.section ?? "",
        }));
}
