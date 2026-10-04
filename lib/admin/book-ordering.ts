import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export {
    normalizeAuthor,
    clampPosition,
    computeMoveResult,
    groupChanged,
    validateGroupIntegrity,
} from "@/lib/admin/book-ordering-pure";

// ─── DB-backed helpers ────────────────────────────────────────────────────────

/**
 * Returns the next author_sort_order for a new book in the given (section, author) group.
 * Server-side only; not trusted from the client.
 */
export async function getNextAuthorSortOrder(
    sectionId: string,
    author: string | null,
): Promise<number> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("get_next_author_sort_order", {
        p_section_id: sectionId,
        p_author: author ?? null,
    });
    if (error) throw new Error("Не удалось определить порядок книги.");
    return (data as number) ?? 1;
}

/**
 * Atomically reorders a book within its (section, author) group.
 * Positions outside [1, N] are clamped by the DB function.
 */
export async function moveBookInAuthorGroup(
    bookId: string,
    newPosition: number,
): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.rpc("move_book_in_author_group", {
        p_book_id: bookId,
        p_new_position: newPosition,
    });
    if (error) throw new Error("Не удалось изменить порядок книги.");
}

/**
 * Atomically moves a book to a different (section, author) group.
 * Compacts the old group and appends the book to the end of the new group.
 * Returns the new author_sort_order.
 */
export async function reassignBookAuthorGroup(
    bookId: string,
    newSectionId: string,
    newAuthor: string | null,
): Promise<number> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("reassign_book_author_group", {
        p_book_id: bookId,
        p_new_section: newSectionId,
        p_new_author: newAuthor ?? null,
    });
    if (error) throw new Error("Не удалось перенести книгу в новую группу.");
    return (data as number) ?? 1;
}
