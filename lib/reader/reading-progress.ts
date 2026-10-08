import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 500;

/**
 * Fetches all rows from a paginated Supabase query builder.
 *
 * Calls the builder with successive .range() windows until a page arrives with
 * fewer rows than PAGE_SIZE (indicating the last page). Throws if any page
 * returns an error — a partial result is never silently returned as complete.
 */
async function fetchAllPages<T>(
    buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
    const all: T[] = [];
    let from = 0;

    while (true) {
        const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);

        if (error) {
            throw error;
        }

        const page = data ?? [];
        all.push(...page);

        if (page.length < PAGE_SIZE) {
            break;
        }

        from += PAGE_SIZE;
    }

    return all;
}

/**
 * Returns the set of chapter IDs that the given user has marked as read
 * among the chapters of a single book.
 *
 * Uses the service-role client so it is not subject to RLS.
 * Callers must have already verified the user's identity.
 *
 * Paginates in 500-row pages to avoid the PostgREST default row limit.
 */
export async function getReadChapterIdsForBook(
    userId: string,
    bookId: string,
): Promise<Set<string>> {
    const supabase = createSupabaseAdminClient();

    let rows: { chapter_id: string }[];
    try {
        rows = await fetchAllPages((from, to) =>
            supabase
                .from("chapter_read_progress")
                .select("chapter_id, chapters!inner(book_id)")
                .eq("user_id", userId)
                .eq("chapters.book_id", bookId)
                .range(from, to),
        );
    } catch {
        throw new Error("Не удалось получить прогресс чтения.");
    }

    return new Set(rows.map((row) => row.chapter_id));
}

/**
 * Returns the set of chapter IDs that the given user has marked as read,
 * restricted to chapters that belong to one of the provided book IDs.
 *
 * Used by section catalog pages to calculate completion without N+1 queries.
 *
 * Paginates in 500-row pages to avoid the PostgREST default row limit.
 */
export async function getReadChapterIdsForBooks(
    userId: string,
    bookIds: string[],
): Promise<Set<string>> {
    if (bookIds.length === 0) {
        return new Set();
    }

    const supabase = createSupabaseAdminClient();

    let rows: { chapter_id: string }[];
    try {
        rows = await fetchAllPages((from, to) =>
            supabase
                .from("chapter_read_progress")
                .select("chapter_id, chapters!inner(book_id)")
                .eq("user_id", userId)
                .in("chapters.book_id", bookIds)
                .range(from, to),
        );
    } catch {
        throw new Error("Не удалось получить прогресс чтения.");
    }

    return new Set(rows.map((row) => row.chapter_id));
}

/**
 * Marks a chapter as read for the given user.
 * Idempotent: a duplicate upsert silently succeeds.
 *
 * Callers must verify chapter access before calling this function.
 */
export async function markChapterRead(userId: string, chapterId: string): Promise<void> {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
        .from("chapter_read_progress")
        .upsert({ user_id: userId, chapter_id: chapterId }, { onConflict: "user_id,chapter_id" });

    if (error) {
        throw new Error("Не удалось сохранить прогресс чтения.");
    }
}

/**
 * Unmarks a chapter as read for the given user.
 * Idempotent: deleting a non-existent row silently succeeds.
 *
 * Callers must verify chapter access before calling this function.
 */
export async function unmarkChapterRead(userId: string, chapterId: string): Promise<void> {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
        .from("chapter_read_progress")
        .delete()
        .eq("user_id", userId)
        .eq("chapter_id", chapterId);

    if (error) {
        throw new Error("Не удалось удалить прогресс чтения.");
    }
}

/**
 * Returns the published chapter IDs for a set of books.
 * Result is a Map from bookId → array of published chapterIds.
 *
 * Used together with getReadChapterIdsForBooks to calculate completion.
 *
 * Paginates in 500-row pages to avoid the PostgREST default row limit.
 */
export async function getPublishedChapterIdsByBook(
    bookIds: string[],
): Promise<Map<string, string[]>> {
    if (bookIds.length === 0) {
        return new Map();
    }

    const supabase = createSupabaseAdminClient();

    let rows: { id: string; book_id: string }[];
    try {
        rows = await fetchAllPages((from, to) =>
            supabase
                .from("chapters")
                .select("id, book_id")
                .in("book_id", bookIds)
                .eq("status", "published")
                .range(from, to),
        );
    } catch {
        throw new Error("Не удалось получить список глав.");
    }

    const result = new Map<string, string[]>();
    for (const row of rows) {
        const existing = result.get(row.book_id) ?? [];
        existing.push(row.id);
        result.set(row.book_id, existing);
    }
    return result;
}
