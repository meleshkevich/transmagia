"use server";

import { reorderChapters } from "@/lib/admin/mutations";

export async function reorderChaptersAction(
    bookId: string,
    orderedChapterIds: string[],
) {
    return reorderChapters(bookId, orderedChapterIds);
}
