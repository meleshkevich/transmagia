export function canDeleteComment(
    profile: { id: string; is_admin: boolean } | null,
    commentUserId: string | null,
): boolean {
    if (!profile) return false;
    if (profile.is_admin) return true;
    return commentUserId !== null && profile.id === commentUserId;
}
