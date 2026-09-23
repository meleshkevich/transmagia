import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

// Tiptap's generateJSON uses DOMParser internally — polyfill for Node.js.
const _dom = new JSDOM("<!doctype html><html><body></body></html>");
globalThis.window = _dom.window;
globalThis.document = _dom.window.document;
globalThis.DOMParser = _dom.window.DOMParser;

const SELECTORS = {
    content: [".post-content", ".entry-content"],
    title: ["h1.post-title", "h1.entry-title", "h1"],
};

/**
 * Fetch a URL and return raw HTML.
 * @returns {{ ok: boolean, status: number, html: string }}
 */
export async function fetchWordPressPage(url) {
    const response = await fetch(url);
    const html = await response.text();
    return { ok: response.ok, status: response.status, html };
}

/**
 * Find the first matching content container in a parsed page.
 * Tries .post-content then .entry-content inside article, then standalone.
 * @returns {Cheerio | null}
 */
function findContentContainer($) {
    const article = $("article").first();
    for (const sel of SELECTORS.content) {
        const el = article.find(sel).first();
        if (el.length) return el;
    }
    for (const sel of SELECTORS.content) {
        const el = $(sel).first();
        if (el.length) return el;
    }
    return null;
}

/**
 * Extract chapter links from a WordPress book page.
 * Returns deduplicated same-domain links from the content area, in document order.
 * @param {string} html
 * @param {string} bookUrl
 * @returns {Array<{ href: string, text: string }>}
 */
export function extractChapterLinks(html, bookUrl) {
    const $ = cheerio.load(html);
    const container = findContentContainer($);
    if (!container) return [];

    const bookOrigin = new URL(bookUrl).origin;
    const normalizedBookUrl = normalizeTrailingSlash(bookUrl);

    const links = [];
    const seen = new Set();

    container.find("a[href]").each((_i, el) => {
        const raw = $(el).attr("href") ?? "";
        const text = $(el).text().trim();
        if (!raw || raw.startsWith("#") || !text) return;

        let href;
        try {
            href = normalizeTrailingSlash(new URL(raw, bookUrl).toString());
        } catch {
            return;
        }

        // Same domain only
        if (!href.startsWith(bookOrigin)) return;
        // Exclude the book page itself
        if (href === normalizedBookUrl) return;
        // Exclude wp-admin, feeds, tag/category pages
        if (/\/(wp-admin|wp-content|feed|tag|category|author)\//i.test(href)) return;

        if (!seen.has(href)) {
            seen.add(href);
            links.push({ href, text });
        }
    });

    return links;
}

function normalizeTrailingSlash(url) {
    try {
        const u = new URL(url);
        if (!u.pathname.endsWith("/")) u.pathname += "/";
        // RFC 3986 §2.1: percent-encoding is case-insensitive; uppercase is canonical.
        // Node's URL serializer emits lowercase; normalize so stored and extracted URLs match.
        return u.toString().replace(/%[0-9a-f]{2}/gi, m => m.toUpperCase());
    } catch {
        return url;
    }
}

// Exported alias used by migrate.mjs to normalize book URLs before DB lookup.
export { normalizeTrailingSlash as normalizeUrl };

/**
 * Parse a WordPress chapter page.
 * Preserves rawHtml (before cleaning) and cleanedHtml (after cleaning) separately.
 * @param {string} html - full page HTML
 * @returns {{ ok: boolean, error?: string, rawHtml?: string, cleanedHtml?: string,
 *             content?: object, pageTitle?: string, extractedTitle?: string,
 *             sourcePostId?: number|null, images?: string[], nodeCount?: object }}
 */
export function parseChapterHtml(html) {
    const $ = cheerio.load(html);
    const container = findContentContainer($);

    if (!container || !container.length) {
        return { ok: false, error: "Could not locate content container (article > .post-content / .entry-content)" };
    }

    const pageTitle = $("title").first().text().trim();

    let extractedTitle = "";
    for (const sel of SELECTORS.title) {
        const t = $("article").find(sel).first().text().trim();
        if (t) { extractedTitle = t; break; }
    }

    const sourcePostId = (($("body").attr("class") ?? "").match(/postid-(\d+)/) ?? [])[1] ?? null;

    // Capture rawHtml BEFORE any mutation
    const rawHtml = container.html()?.trim() ?? "";

    // Extract image URLs from raw HTML before cleaning strips attributes
    const images = extractImages($, container);

    // Clean (mutates DOM in place)
    const cleanedHtml = cleanWordPressContent($, container);

    let content;
    try {
        content = convertHtmlToTiptap(cleanedHtml);
    } catch (err) {
        return {
            ok: false,
            error: `Tiptap conversion failed: ${err instanceof Error ? err.message : String(err)}`,
            rawHtml,
            cleanedHtml,
        };
    }

    if (content.type !== "doc" || !Array.isArray(content.content)) {
        return { ok: false, error: "Generated content is not a valid Tiptap document", rawHtml, cleanedHtml };
    }

    return {
        ok: true,
        rawHtml,
        cleanedHtml,
        content,
        pageTitle,
        extractedTitle,
        sourcePostId: sourcePostId ? Number(sourcePostId) : null,
        images,
        nodeCount: countTiptapNodes(content),
    };
}

/**
 * Remove WordPress navigation, ads, comments, and presentation-only attributes.
 * Preserved exactly from the proven existing migration tool.
 * @param {CheerioAPI} $
 * @param {Cheerio} container
 * @returns {string} cleaned inner HTML
 */
export function cleanWordPressContent($, container) {
    $(container).find(
        "script, style, nav, form, .sharedaddy, .jp-relatedposts, .comments-area, " +
        ".comment-respond, .post-navigation, .previous, .next, .post-categories, " +
        ".post-meta, .wp-block-spacer"
    ).remove();
    $(container).find("[class*='share'], [class*='social'], [class*='advert'], [class*='widget']").remove();
    $(container).find("*").each((_index, element) => {
        const node = $(element);
        node.removeAttr("id");
        node.removeAttr("style");
        node.removeAttr("onclick");
        for (const attribute of ["class", "data-id", "data-block", "aria-label"]) {
            node.removeAttr(attribute);
        }
    });
    return $(container).html()?.trim() ?? "";
}

/**
 * Extract image src/data-src URLs from a container.
 * Call this BEFORE cleanWordPressContent to capture all attribute variants.
 * @param {CheerioAPI} $
 * @param {Cheerio} container
 * @returns {string[]}
 */
export function extractImages($, container) {
    return $(container)
        .find("img")
        .map((_i, el) => $(el).attr("src") || $(el).attr("data-src"))
        .get()
        .filter(Boolean);
}

/**
 * Convert cleaned HTML to a Tiptap JSON document.
 * @param {string} html
 * @returns {object}
 */
export function convertHtmlToTiptap(html) {
    return generateJSON(html, [StarterKit, Image]);
}

/**
 * Count each node type in a Tiptap document tree.
 * @param {object} doc
 * @returns {Record<string, number>}
 */
export function countTiptapNodes(doc) {
    const counts = {};
    function visit(node) {
        if (!node || typeof node !== "object") return;
        if (typeof node.type === "string") counts[node.type] = (counts[node.type] ?? 0) + 1;
        for (const child of node.content ?? []) visit(child);
    }
    visit(doc);
    return counts;
}
