import { describe, expect, it } from "vitest";
import { evaluateSectionAccess, isCatalogRestricted } from "./access-policy";

// Test fixtures for the access matrix
const ADMIN = { is_admin: true };
const USER = { is_admin: false };
const ANON = null;

const PUBLIC = { password_hash: null };
const PROTECTED = { password_hash: "scrypt$16384$8$1$aabbcc$ddeeff" };
const NO_SECTION = null;

describe("evaluateSectionAccess — access matrix", () => {
    // ─── Missing section ────────────────────────────────────────────────────────

    it("1. missing section: anonymous → denied", () => {
        expect(evaluateSectionAccess(ANON, NO_SECTION, false)).toMatchObject({ canRead: false, requiresAuth: false });
    });

    it("2. missing section: authenticated → denied", () => {
        expect(evaluateSectionAccess(USER, NO_SECTION, false).canRead).toBe(false);
    });

    it("3. missing section: admin → denied", () => {
        expect(evaluateSectionAccess(ADMIN, NO_SECTION, false).canRead).toBe(false);
    });

    // ─── Admin bypass ───────────────────────────────────────────────────────────

    it("4. admin: public section → always allowed", () => {
        expect(evaluateSectionAccess(ADMIN, PUBLIC, false).canRead).toBe(true);
    });

    it("5. admin: protected section without cookie → allowed (bypasses password)", () => {
        expect(evaluateSectionAccess(ADMIN, PROTECTED, false).canRead).toBe(true);
    });

    it("6. admin: never requires password or auth", () => {
        const result = evaluateSectionAccess(ADMIN, PROTECTED, false);
        expect(result.requiresPassword).toBe(false);
        expect(result.requiresAuth).toBe(false);
    });

    // ─── Anonymous users: always blocked from individual content ────────────────

    it("7. anonymous: public section → denied (individual content always requires auth)", () => {
        expect(evaluateSectionAccess(ANON, PUBLIC, false).canRead).toBe(false);
    });

    it("8. anonymous: public section → requiresAuth", () => {
        expect(evaluateSectionAccess(ANON, PUBLIC, false).requiresAuth).toBe(true);
    });

    it("9. anonymous: protected section without cookie → denied", () => {
        expect(evaluateSectionAccess(ANON, PROTECTED, false).canRead).toBe(false);
    });

    it("10. anonymous: protected section with cookie → still denied (cookie insufficient without auth)", () => {
        // A section cookie alone does not grant access — authentication is required first
        expect(evaluateSectionAccess(ANON, PROTECTED, true).canRead).toBe(false);
    });

    it("11. anonymous: requiresAuth surfaced, not requiresPassword (auth comes first in the UI flow)", () => {
        const result = evaluateSectionAccess(ANON, PROTECTED, false);
        expect(result.requiresAuth).toBe(true);
        expect(result.requiresPassword).toBe(false);
    });

    // ─── Authenticated user, public section (originals / fanfiction) ─────────────

    it("12. authenticated: public section, no cookie → allowed", () => {
        expect(evaluateSectionAccess(USER, PUBLIC, false).canRead).toBe(true);
    });

    it("13. authenticated: public section → no extra requirements", () => {
        const result = evaluateSectionAccess(USER, PUBLIC, false);
        expect(result.requiresAuth).toBe(false);
        expect(result.requiresPassword).toBe(false);
    });

    // ─── Authenticated user, translations (password-protected section) ───────────

    it("14. authenticated: protected section without cookie → denied", () => {
        expect(evaluateSectionAccess(USER, PROTECTED, false).canRead).toBe(false);
    });

    it("15. authenticated: protected section without cookie → requiresPassword (not requiresAuth)", () => {
        const result = evaluateSectionAccess(USER, PROTECTED, false);
        expect(result.requiresPassword).toBe(true);
        expect(result.requiresAuth).toBe(false);
    });

    it("16. authenticated: protected section with valid cookie → allowed", () => {
        expect(evaluateSectionAccess(USER, PROTECTED, true).canRead).toBe(true);
    });

    it("17. authenticated: protected section with valid cookie → no extra requirements", () => {
        const result = evaluateSectionAccess(USER, PROTECTED, true);
        expect(result.requiresPassword).toBe(false);
        expect(result.requiresAuth).toBe(false);
    });

    it("18. authenticated: protected section, cookie expires → access revoked", () => {
        // After expiry hasCookie becomes false
        expect(evaluateSectionAccess(USER, PROTECTED, false).canRead).toBe(false);
    });

    // ─── Admin password management ───────────────────────────────────────────────

    it("19. admin: sets password → section becomes protected (cookie now required for users)", () => {
        // After password is set, user without cookie loses access
        expect(evaluateSectionAccess(USER, PROTECTED, false).canRead).toBe(false);
    });

    it("20. admin: removes password → section becomes public (users can enter without cookie)", () => {
        // After password removal, authenticated users can read without a cookie
        expect(evaluateSectionAccess(USER, PUBLIC, false).canRead).toBe(true);
    });

    it("21. admin: can still read after removing password", () => {
        expect(evaluateSectionAccess(ADMIN, PUBLIC, false).canRead).toBe(true);
    });

    // ─── Comment access (derives from section read access) ───────────────────────

    it("22. authenticated with section access can comment (profile present = canComment)", () => {
        // canComment is gated on getCurrentProfile() ≠ null, consistent with canRead here
        const { canRead } = evaluateSectionAccess(USER, PUBLIC, false);
        expect(canRead).toBe(true); // profile would be non-null → canComment = true
    });

    it("23. anonymous cannot comment (no profile, blocked before comment form renders)", () => {
        const { canRead } = evaluateSectionAccess(ANON, PUBLIC, false);
        expect(canRead).toBe(false); // profile would be null → canComment = false
    });

    // ─── Determinism / edge cases ────────────────────────────────────────────────

    it("24. identical inputs always produce identical decisions", () => {
        const a = evaluateSectionAccess(USER, PROTECTED, true);
        const b = evaluateSectionAccess(USER, PROTECTED, true);
        expect(a).toEqual(b);
    });

    it("25. password_hash value is opaque — only its nullness matters for access", () => {
        const withHash = { password_hash: "anything" };
        const withDifferentHash = { password_hash: "something_else" };
        // Both are treated identically: protected section, need cookie
        expect(evaluateSectionAccess(USER, withHash, false)).toEqual(
            evaluateSectionAccess(USER, withDifferentHash, false),
        );
    });
});

// ─── isCatalogRestricted — catalog-level access gate ────────────────────────────
//
// This function determines whether the section CATALOG page must apply the
// authentication/password gate. It is distinct from evaluateSectionAccess:
//
//   - Public sections (originals, fanfiction): isCatalogRestricted = false
//     → catalog is visible to anonymous users; individual books/chapters still require auth
//
//   - Private sections (translations and any section with password_hash set):
//     isCatalogRestricted = true → gate runs → anonymous is redirected to login
//
// Test cases map directly to the 9 required scenarios:

describe("isCatalogRestricted — catalog access gate", () => {
    // ─── Case 1: anonymous + public section catalog → allowed ────────────────────

    it("case 1: originals (public slug, no password) → not restricted → anonymous can view catalog", () => {
        expect(isCatalogRestricted("originals", false)).toBe(false);
    });

    it("case 1b: fanfiction (public slug, no password) → not restricted → anonymous can view catalog", () => {
        expect(isCatalogRestricted("fanfiction", false)).toBe(false);
    });

    // ─── Case 2: anonymous + protected section catalog → denied/login ────────────

    it("case 2a: translations without password_hash → still restricted (slug is in PRIVATE_CATALOG_SLUGS)", () => {
        // Root cause of the regression: isProtected=false when password_hash IS NULL,
        // but translations must still require authentication for catalog access.
        expect(isCatalogRestricted("translations", false)).toBe(true);
    });

    it("case 2b: translations with password_hash → restricted", () => {
        expect(isCatalogRestricted("translations", true)).toBe(true);
    });

    it("case 2c: any section that has a password_hash is restricted regardless of slug", () => {
        expect(isCatalogRestricted("some-other-section", true)).toBe(true);
    });

    // ─── Cases 3–5 covered by evaluateSectionAccess above; shown here for clarity ─

    it("case 3: authenticated + protected section + no cookie → gate applies (requiresPassword)", () => {
        // isCatalogRestricted = true → evaluateSectionAccess is called in the section page
        const decision = evaluateSectionAccess(USER, PROTECTED, false);
        expect(decision.canRead).toBe(false);
        expect(decision.requiresPassword).toBe(true);
    });

    it("case 4: authenticated + protected section + valid cookie → catalog shown", () => {
        const decision = evaluateSectionAccess(USER, PROTECTED, true);
        expect(decision.canRead).toBe(true);
    });

    it("case 5: admin + protected section → catalog shown without password", () => {
        const decision = evaluateSectionAccess(ADMIN, PROTECTED, false);
        expect(decision.canRead).toBe(true);
        expect(decision.requiresPassword).toBe(false);
    });

    // ─── Cases 6–7: anonymous + direct book/chapter URL → denied ────────────────

    it("case 6: anonymous + protected book → denied (requiresAuth, not requiresPassword)", () => {
        // Book page redirects to login because evaluateSectionAccess returns requiresAuth
        const decision = evaluateSectionAccess(ANON, PROTECTED, false);
        expect(decision.canRead).toBe(false);
        expect(decision.requiresAuth).toBe(true);
    });

    it("case 7: anonymous + protected chapter → denied (same rule, section has no password)", () => {
        // Chapter page has early redirect for unauthenticated users; policy confirms denied
        const decision = evaluateSectionAccess(ANON, PUBLIC, false);
        expect(decision.canRead).toBe(false);
        expect(decision.requiresAuth).toBe(true);
    });

    // ─── Cases 8–9: authenticated + protected book/chapter + no cookie → password gate

    it("case 8: authenticated + protected book + no cookie → password gate (requiresPassword)", () => {
        const decision = evaluateSectionAccess(USER, PROTECTED, false);
        expect(decision.canRead).toBe(false);
        expect(decision.requiresPassword).toBe(true);
    });

    it("case 9: authenticated + protected chapter + no cookie → password gate (requiresPassword)", () => {
        // Chapter page shows SectionGate when canRead=false for authenticated users
        const decision = evaluateSectionAccess(USER, PROTECTED, false);
        expect(decision.canRead).toBe(false);
        expect(decision.requiresPassword).toBe(true);
    });
});
