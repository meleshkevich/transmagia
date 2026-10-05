export type AccessProfile = { is_admin: boolean } | null;
export type AccessSection = { password_hash: string | null } | null;

export type AccessDecision = {
    canRead: boolean;
    requiresAuth: boolean;
    requiresPassword: boolean;
};

/**
 * Section slugs whose CATALOG requires authentication even when no password is set.
 * These sections are never publicly browsable by anonymous users, regardless of
 * whether an admin has configured a password yet.
 *
 * Public-catalog sections (originals, fanfiction) are intentionally absent — they
 * allow anonymous browsing of the catalog while still requiring auth for individual
 * books and chapters.
 */
export const PRIVATE_CATALOG_SLUGS = new Set(["translations"]);

/**
 * Returns true when the section catalog page must apply the authentication/password
 * gate. False means the catalog is publicly accessible (anonymous users allowed).
 *
 * A section is restricted when it either:
 *  – has a password_hash set in the database (isProtected = true), OR
 *  – is explicitly listed as a private catalog regardless of password status.
 */
export function isCatalogRestricted(slug: string, isProtected: boolean): boolean {
    return isProtected || PRIVATE_CATALOG_SLUGS.has(slug);
}

/**
 * Pure, synchronous access decision. No server dependencies — fully unit-testable.
 *
 * Rules:
 * 1. Missing section → denied
 * 2. Admin → always allowed
 * 3. Anonymous → always denied (individual book/chapter content is never public)
 * 4. Authenticated + no password → allowed
 * 5. Authenticated + password-protected + valid cookie → allowed
 * 6. Authenticated + password-protected + no/expired cookie → denied, requiresPassword
 */
/**
 * Returns true when a book's status makes it visible to the public.
 * draft = not public; ongoing = public but unfinished; published = public and finished.
 */
export function isPublicBookStatus(status: "draft" | "ongoing" | "published"): boolean {
    return status === "ongoing" || status === "published";
}

export function evaluateSectionAccess(
    profile: AccessProfile,
    section: AccessSection,
    hasCookie: boolean,
): AccessDecision {
    if (!section) {
        return { canRead: false, requiresAuth: false, requiresPassword: false };
    }

    if (profile?.is_admin) {
        return { canRead: true, requiresAuth: false, requiresPassword: false };
    }

    if (!profile) {
        return { canRead: false, requiresAuth: true, requiresPassword: false };
    }

    if (section.password_hash === null) {
        return { canRead: true, requiresAuth: false, requiresPassword: false };
    }

    if (hasCookie) {
        return { canRead: true, requiresAuth: false, requiresPassword: false };
    }

    return { canRead: false, requiresAuth: false, requiresPassword: true };
}
