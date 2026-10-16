export function resolveAuthorName(profile: { display_name: string | null } | null): string {
    if (profile === null) {
        return "Удалённый пользователь";
    }
    const name = profile.display_name?.trim();
    return name || "Читатель";
}
