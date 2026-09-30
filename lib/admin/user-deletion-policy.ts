const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
    return UUID_RE.test(id);
}

export type DeletionContext = {
    currentUserId: string;
    targetUserId: string;
    targetProfile: { is_admin: boolean } | null;
    /** Current total count of admin profiles (before deletion). */
    currentAdminCount: number;
};

export type DeletionDecision =
    | { allowed: true }
    | { allowed: false; reason: string };

/**
 * Pure, synchronous deletion policy. No server or DB dependencies — fully unit-testable.
 *
 * Rules applied in order:
 * 1. Malformed target UUID → rejected
 * 2. Self-delete → rejected
 * 3. Target not found → rejected
 * 4. Deleting the last admin → rejected
 * Otherwise → allowed
 *
 * Caller is assumed to already be admin-authenticated (requireAdmin() enforces this
 * in the server layer before this function is reached).
 */
export function evaluateDeletion(ctx: DeletionContext): DeletionDecision {
    if (!isValidUUID(ctx.targetUserId)) {
        return { allowed: false, reason: "Некорректный идентификатор пользователя." };
    }

    if (ctx.currentUserId === ctx.targetUserId) {
        return { allowed: false, reason: "Нельзя удалить собственную учётную запись." };
    }

    if (ctx.targetProfile === null) {
        return { allowed: false, reason: "Пользователь не найден." };
    }

    if (ctx.targetProfile.is_admin && ctx.currentAdminCount <= 1) {
        return { allowed: false, reason: "Нельзя удалить последнего администратора." };
    }

    return { allowed: true };
}
