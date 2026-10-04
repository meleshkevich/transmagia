/**
 * Pure, synchronous ordering helpers — no server dependencies, fully unit-testable.
 * Matches the COALESCE(btrim(author), '') expression used in the DB indexes/functions.
 */

/** Canonical author key: NULL and empty/whitespace all map to ''. */
export function normalizeAuthor(author: string | null | undefined): string {
    return author?.trim() ?? "";
}

/** Clamp a requested position to the valid range [1, groupSize]. */
export function clampPosition(requested: number, groupSize: number): number {
    const max = Math.max(groupSize, 1);
    return Math.max(1, Math.min(requested, max));
}

/**
 * Compute expected final 1-based order after moving a book within a group of `n`.
 * Returns original 1-based positions in their new order.
 * Pure — no DB access — used for testing.
 */
export function computeMoveResult(n: number, from: number, to: number): number[] {
    const clamped = clampPosition(to, n);
    const order = Array.from({ length: n }, (_, i) => i + 1);
    const [item] = order.splice(from - 1, 1);
    order.splice(clamped - 1, 0, item);
    return order;
}

/** True when author/section group changed, requiring a group reassignment. */
export function groupChanged(
    oldSectionId: string,
    oldAuthor: string | null,
    newSectionId: string,
    newAuthor: string | null,
): boolean {
    return oldSectionId !== newSectionId || normalizeAuthor(oldAuthor) !== normalizeAuthor(newAuthor);
}

/**
 * Validate that positions form a contiguous 1..N sequence.
 * Returns violation descriptions (empty = valid).
 */
export function validateGroupIntegrity(positions: number[]): string[] {
    const errors: string[] = [];
    if (positions.length === 0) return errors;
    const sorted = [...positions].sort((a, b) => a - b);
    if (positions.length !== new Set(positions).size) errors.push("duplicate positions");
    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] !== i + 1) {
            errors.push(`gap at position ${i + 1} (found ${sorted[i]})`);
            break;
        }
    }
    return errors;
}
