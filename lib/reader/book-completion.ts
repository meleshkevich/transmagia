/**
 * Pure helper that derives which books are fully read by comparing published
 * chapter counts against the user's read chapter IDs.
 *
 * A book is considered fully read when:
 *  - it has at least one currently published chapter
 *  - every published chapter has a progress record for the current user
 *
 * No database access — fully unit-testable.
 */
export function getCompletedBookIds(
    publishedChaptersByBook: Map<string, string[]>,
    readChapterIds: Set<string>,
): Set<string> {
    const completed = new Set<string>();

    for (const [bookId, chapterIds] of publishedChaptersByBook) {
        // Zero published chapters → never completed (0 === 0 must not trigger).
        if (chapterIds.length === 0) {
            continue;
        }

        const allRead = chapterIds.every((id) => readChapterIds.has(id));
        if (allRead) {
            completed.add(bookId);
        }
    }

    return completed;
}
