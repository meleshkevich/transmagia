import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;

const sourceUrl = "https://transmagia.house/1-%D0%B6%D0%B8%D0%B7%D0%BD%D1%8C-%D1%85%D1%83%D0%B4%D1%88%D0%B0%D1%8F-%D0%B8%D0%B7-%D0%BF%D1%80%D0%BE%D1%8F%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B9-%D1%80%D0%B5%D0%B0%D0%BB%D1%8C%D0%BD%D0%BE%D1%81%D1%82/";
const sourceTitle = "1. Жизнь — худшая из проявлений реальности";
const targetBookTitle = "Шум дождя";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function assertEnvironment() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables.");
  }
}

function cleanContent($, container) {
  $(container).find("script, style, nav, form, .sharedaddy, .jp-relatedposts, .comments-area, .comment-respond, .post-navigation, .previous, .next, .post-categories, .post-meta, .wp-block-spacer").remove();
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

function getSourceImages($, container) {
  return $(container).find("img").map((_index, element) => $(element).attr("src") || $(element).attr("data-src")).get().filter(Boolean);
}

async function uploadSourceImages($, container, bookId) {
  const imagePaths = [];
  for (const imageUrl of getSourceImages($, container)) {
    const absoluteUrl = new URL(imageUrl, sourceUrl).toString();
    const response = await fetch(absoluteUrl);
    if (!response.ok) throw new Error(`Image fetch failed: ${response.status} ${absoluteUrl}`);
    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    if (!contentType.startsWith("image/")) throw new Error(`Unexpected image type: ${contentType}`);
    const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
    const path = `${bookId}/migration-test/${randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("content-images").upload(path, Buffer.from(await response.arrayBuffer()), {
      contentType,
      upsert: false,
    });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    imagePaths.push({ source: absoluteUrl, path });
  }

  $(container).find("img").each((index, element) => {
    const image = imagePaths[index];
    if (!image) return;
    $(element).attr("src", `/api/content-images/${image.path}`);
    $(element).removeAttr("srcset");
    $(element).removeAttr("sizes");
  });

  return imagePaths;
}

function countNodes(document) {
  const counts = {};
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (typeof node.type === "string") counts[node.type] = (counts[node.type] ?? 0) + 1;
    for (const child of node.content ?? []) visit(child);
  }
  visit(document);
  return counts;
}

async function main() {
  assertEnvironment();
  const { data: books, error: bookError } = await supabase.from("books").select("id, title, slug, section_id").eq("title", targetBookTitle);
  if (bookError) throw bookError;
  if (!books?.length) throw new Error(`Target book not found: ${targetBookTitle}. No record was created.`);
  if (books.length > 1) throw new Error(`Target book is ambiguous: ${books.length} matches.`);
  const book = books[0];

  const { data: existing, error: existingError } = await supabase.from("chapters").select("id, title, status, legacy_url").eq("legacy_url", sourceUrl).maybeSingle();
  if (existingError) throw existingError;
  if (existing) throw new Error(`Source chapter already imported as ${existing.id}; no duplicate was created.`);

  const sourceResponse = await fetch(sourceUrl);
  if (!sourceResponse.ok) throw new Error(`Source fetch failed: ${sourceResponse.status}`);
  const sourceHtml = await sourceResponse.text();
  const $ = cheerio.load(sourceHtml);
  const article = $("article").first();
  const container = article.find(".post-content").first();
  if (!article.length || !container.length) throw new Error("Could not locate article .post-content container.");

  const pageTitle = $("title").first().text().trim();
  const extractedTitle = article.find("h1.post-title").first().text().trim();
  const sourcePostId = (($("body").attr("class") ?? "").match(/postid-(\d+)/) ?? [])[1] ?? null;
  const beforeHtml = cleanContent($, container);
  const imagePaths = await uploadSourceImages($, container, book.id);
  const cleanedHtml = cleanContent($, container);
  const content = generateJSON(cleanedHtml, [StarterKit, Image]);
  if (content.type !== "doc" || !Array.isArray(content.content)) throw new Error("Generated content is not a Tiptap document.");

  const { data: chapter, error: insertError } = await supabase.from("chapters").insert({
    book_id: book.id,
    title: sourceTitle,
    slug: "1-zhizn-khudshaya-iz-proyavleniy-realnosti",
    content,
    sort_order: 1,
    status: "draft",
    legacy_wp_id: sourcePostId ? Number(sourcePostId) : null,
    legacy_url: sourceUrl,
  }).select("id, book_id, title, slug, status, sort_order, legacy_wp_id, legacy_url, content").single();
  if (insertError) throw insertError;

  const forbidden = ["main-sidebar", "comments-area", "comment-respond", "post-navigation", "site-footer", "previous", "next", "post-meta"];
  const output = {
    source: { url: sourceUrl, pageTitle, extractedTitle, sourcePostId },
    selector: "article > .post-content",
    targetBook: { id: book.id, title: book.title, slug: book.slug },
    chapter: { id: chapter.id, title: chapter.title, status: chapter.status, sort_order: chapter.sort_order, legacy_wp_id: chapter.legacy_wp_id, legacy_url: chapter.legacy_url },
    conversion: { beforeHtmlBytes: Buffer.byteLength(beforeHtml), cleanedHtmlBytes: Buffer.byteLength(cleanedHtml), nodeCounts: countNodes(content), imageCount: imagePaths.length, imagePaths },
    exclusions: { forbiddenSelectorsRemoved: forbidden, bodyImported: false },
  };
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
