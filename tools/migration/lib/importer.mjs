import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
    }
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function findSectionBySlug(supabase, slug) {
    const { data, error } = await supabase
        .from("sections")
        .select("id, name, slug")
        .eq("slug", slug)
        .maybeSingle();
    if (error) throw error;
    return data ?? null;
}

export async function findBookByLegacyUrl(supabase, legacyUrl) {
    const { data, error } = await supabase
        .from("books")
        .select("id, title, slug, legacy_url, legacy_wp_id, section_id")
        .eq("legacy_url", legacyUrl)
        .maybeSingle();
    if (error) throw error;
    return data ?? null;
}

export async function findBookByWpId(supabase, legacyWpId) {
    const { data, error } = await supabase
        .from("books")
        .select("id, title, slug, legacy_url, legacy_wp_id, section_id")
        .eq("legacy_wp_id", legacyWpId)
        .maybeSingle();
    if (error) throw error;
    return data ?? null;
}

export async function findBookBySectionAndSlug(supabase, sectionId, slug) {
    const { data, error } = await supabase
        .from("books")
        .select("id, title, slug, legacy_url, legacy_wp_id, section_id")
        .eq("section_id", sectionId)
        .eq("slug", slug)
        .maybeSingle();
    if (error) throw error;
    return data ?? null;
}

export async function findChapterByLegacyUrl(supabase, legacyUrl) {
    const { data, error } = await supabase
        .from("chapters")
        .select("id, title, status, legacy_url, legacy_wp_id, book_id")
        .eq("legacy_url", legacyUrl)
        .maybeSingle();
    if (error) throw error;
    return data ?? null;
}

export async function findChapterByWpId(supabase, legacyWpId) {
    const { data, error } = await supabase
        .from("chapters")
        .select("id, title, status, legacy_url, legacy_wp_id, book_id")
        .eq("legacy_wp_id", legacyWpId)
        .maybeSingle();
    if (error) throw error;
    return data ?? null;
}

export async function insertBook(supabase, { sectionId, title, slug, legacyUrl, legacyWpId }) {
    const { data, error } = await supabase
        .from("books")
        .insert({
            section_id: sectionId,
            title,
            slug,
            status: "published",
            legacy_url: legacyUrl,
            legacy_wp_id: legacyWpId ?? null,
        })
        .select("id, title, slug")
        .single();
    if (error) throw error;
    return data;
}

export async function insertChapter(supabase, { bookId, title, slug, content, sortOrder, legacyWpId, legacyUrl }) {
    const { data, error } = await supabase
        .from("chapters")
        .insert({
            book_id: bookId,
            title,
            slug,
            content,
            sort_order: sortOrder,
            status: "published",
            legacy_wp_id: legacyWpId ?? null,
            legacy_url: legacyUrl,
        })
        .select("id, title, slug, sort_order, legacy_url, legacy_wp_id")
        .single();
    if (error) throw error;
    return data;
}

/**
 * Upload a single image to content-images storage and return its new path.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} imageUrl - source image URL (may be relative)
 * @param {string} pageUrl - chapter URL (for resolving relative src)
 * @param {string} bookId - Supabase book UUID (used as storage path prefix)
 * @returns {Promise<{ source: string, path: string }>}
 */
export async function uploadChapterImage(supabase, imageUrl, pageUrl, bookId) {
    const absoluteUrl = new URL(imageUrl, pageUrl).toString();
    const response = await fetch(absoluteUrl);
    if (!response.ok) throw new Error(`Image fetch failed: ${response.status} ${absoluteUrl}`);
    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    if (!contentType.startsWith("image/")) throw new Error(`Unexpected content type: ${contentType}`);
    const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
    const path = `${bookId}/chapters/${randomUUID()}.${extension}`;
    const { error } = await supabase.storage
        .from("content-images")
        .upload(path, Buffer.from(await response.arrayBuffer()), { contentType, upsert: false });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    return { source: absoluteUrl, path };
}
