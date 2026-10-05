/**
 * Returns max(sortOrders) + 1, or 1 if the list is empty.
 * Used to compute the default sort_order for a new chapter.
 */
export function nextChapterSortOrder(sortOrders: number[]): number {
    if (sortOrders.length === 0) return 1;
    return Math.max(...sortOrders) + 1;
}
