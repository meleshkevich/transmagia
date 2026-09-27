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

// ── Book page parsing ─────────────────────────────────────────────────────────

/**
 * Find the first user-uploaded cover image in a WordPress content container.
 * Looks for the first <img> whose src contains /wp-content/uploads/ (WordPress media).
 * Returns { src, el } or null if not found.
 * @param {CheerioAPI} $
 * @param {Cheerio} container
 * @returns {{ src: string, el: CheerioElement } | null}
 */
export function extractBookCover($, container) {
    let coverEl = null;
    let coverSrc = null;

    $(container).find("img").each((_i, el) => {
        if (coverEl) return;
        const src = $(el).attr("src") ?? $(el).attr("data-src") ?? "";
        if (src && src.includes("/wp-content/uploads/")) {
            coverEl = el;
            coverSrc = src;
        }
    });

    if (!coverEl || !coverSrc) return null;
    return { src: coverSrc, el: coverEl };
}

/**
 * Determine whether an href looks like a chapter link from a book page.
 * Reuses the same filtering rules as extractChapterLinks.
 * @param {string} href - absolute URL to test
 * @param {string} bookOrigin
 * @param {string} normalizedBookUrl
 * @returns {boolean}
 */
function isChapterLinkHref(href, bookOrigin, normalizedBookUrl) {
    if (!href || href.startsWith("#")) return false;
    if (!href.startsWith(bookOrigin)) return false;
    if (href === normalizedBookUrl) return false;
    if (/\/(wp-admin|wp-content|feed|tag|category|author)\//i.test(href)) return false;
    return true;
}

/**
 * Find the index of the first top-level child element that begins the chapter list.
 * Handles two structures:
 *   • Bare <a> elements at top level (one per chapter)
 *   • <ul>/<ol> where every contained <a> is a chapter link
 * Returns children.length if no chapter-link section is found (all content is description).
 * @param {CheerioAPI} $
 * @param {Cheerio} container
 * @param {string} bookUrl
 * @returns {number}
 */
function findDescriptionCutoff($, container, bookUrl) {
    const bookOrigin = new URL(bookUrl).origin;
    const normalizedBookUrl = normalizeTrailingSlash(bookUrl);
    const children = $(container).children().toArray();

    for (let i = 0; i < children.length; i++) {
        const el = children[i];
        const tag = (el.tagName ?? "").toLowerCase();

        if (tag === "a") {
            let href;
            try { href = normalizeTrailingSlash(new URL($(el).attr("href") ?? "", bookUrl).toString()); }
            catch { continue; }
            if (isChapterLinkHref(href, bookOrigin, normalizedBookUrl)) return i;
        }

        if (tag === "ul" || tag === "ol") {
            const anchors = $(el).find("a[href]");
            if (anchors.length === 0) continue;
            let allChapter = true;
            anchors.each((_j, a) => {
                if (!allChapter) return;
                let href;
                try { href = normalizeTrailingSlash(new URL($(a).attr("href") ?? "", bookUrl).toString()); }
                catch { allChapter = false; return; }
                if (!isChapterLinkHref(href, bookOrigin, normalizedBookUrl)) allChapter = false;
            });
            if (allChapter) return i;
        }
    }

    return children.length;
}

/**
 * Parse a WordPress BOOK page to extract the cover image and rich-text description.
 *
 * Strategy:
 *  1. Find the content container.
 *  2. Extract the cover <img> (first /wp-content/uploads/ image); remove it from the DOM.
 *  3. Locate the chapter-link boundary (first bare <a> or all-link <ul>/<ol>).
 *  4. Collect top-level children before that boundary as description HTML.
 *  5. Clean and convert description HTML → Tiptap JSON.
 *
 * @param {string} html - full WordPress book page HTML
 * @param {string} bookUrl - the book page URL (used for same-domain link detection)
 * @returns {{
 *   ok: boolean,
 *   error?: string,
 *   warnings: string[],
 *   cover: { src: string } | null,
 *   description: object | null,
 *   descriptionHtml: string,
 *   descriptionNodeCount: Record<string, number>
 * }}
 */
export function parseBookPage(html, bookUrl) {
    const $ = cheerio.load(html);
    const container = findContentContainer($);

    if (!container || !container.length) {
        return {
            ok: false,
            error: "Could not locate content container (article > .post-content / .entry-content)",
            warnings: [],
            cover: null,
            description: null,
            descriptionHtml: "",
            descriptionNodeCount: {},
        };
    }

    const warnings = [];

    // 1. Find cover BEFORE any DOM mutation
    const coverResult = extractBookCover($, container);
    if (!coverResult) {
        warnings.push("No cover image found in content container");
    }

    // 2. Remove cover element (and its now-empty wrapper, if any) from the container
    if (coverResult?.el) {
        const $coverEl = $(coverResult.el);
        const $parent = $coverEl.parent();
        $coverEl.remove();
        // If the parent was a wrapper (e.g. <p>) that is now empty, remove it too
        if ($parent[0] !== container[0] && !$parent.children().length && !$parent.text().trim()) {
            $parent.remove();
        }
    }

    // 3. Find the chapter-link boundary
    const cutoff = findDescriptionCutoff($, container, bookUrl);

    // 4. Collect description children (all top-level nodes before the chapter list)
    const children = $(container).children().toArray();
    const descHtml = children.slice(0, cutoff).map((el) => $.html(el)).join("\n");

    // 5. Clean and convert description to Tiptap
    let description = null;
    let descriptionNodeCount = {};

    if (descHtml.trim()) {
        const $desc = cheerio.load(`<div id="desc-root">${descHtml}</div>`);
        const descContainer = $desc("#desc-root");
        const cleanedDescHtml = cleanWordPressContent($desc, descContainer);

        try {
            description = generateJSON(cleanedDescHtml, [StarterKit, Image]);
            if (description.type !== "doc" || !Array.isArray(description.content)) {
                warnings.push("Tiptap conversion produced invalid document structure");
                description = null;
            } else {
                descriptionNodeCount = countTiptapNodes(description);
            }
        } catch (err) {
            warnings.push(`Description Tiptap conversion failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    } else {
        warnings.push("No description content found before chapter links");
    }

    return {
        ok: true,
        warnings,
        cover: coverResult ? { src: coverResult.src } : null,
        description,
        descriptionHtml: descHtml,
        descriptionNodeCount,
    };
}
