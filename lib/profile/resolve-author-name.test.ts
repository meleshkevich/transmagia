import { describe, expect, it } from "vitest";
import { resolveAuthorName } from "./resolve-author-name";

describe("resolveAuthorName", () => {
    // 1. Existing user with display_name shows their name
    it("existing user with display_name returns their name", () => {
        expect(resolveAuthorName({ display_name: "Алекс" })).toBe("Алекс");
    });

    // 2. Existing user with NULL display_name shows "Читатель"
    it("existing user with null display_name returns Читатель", () => {
        expect(resolveAuthorName({ display_name: null })).toBe("Читатель");
    });

    // 3. Existing user with empty display_name shows "Читатель"
    it("existing user with empty display_name returns Читатель", () => {
        expect(resolveAuthorName({ display_name: "" })).toBe("Читатель");
    });

    // 4. Existing user with whitespace-only display_name shows "Читатель"
    it("existing user with whitespace-only display_name returns Читатель", () => {
        expect(resolveAuthorName({ display_name: "   " })).toBe("Читатель");
    });

    // 5. Deleted user (null profile) shows "Удалённый пользователь"
    it("null profile (deleted user) returns Удалённый пользователь", () => {
        expect(resolveAuthorName(null)).toBe("Удалённый пользователь");
    });

    // 6. A missing profile is not silently misclassified as a deleted user —
    //    when profile exists but display_name is null, it must show "Читатель",
    //    NOT "Удалённый пользователь"
    it("profile with null display_name is distinct from null profile", () => {
        const withNullName = resolveAuthorName({ display_name: null });
        const deletedUser = resolveAuthorName(null);
        expect(withNullName).toBe("Читатель");
        expect(deletedUser).toBe("Удалённый пользователь");
        expect(withNullName).not.toBe(deletedUser);
    });

    // Additional: Cyrillic name is returned as-is
    it("Cyrillic display_name is returned unchanged", () => {
        expect(resolveAuthorName({ display_name: "Мария" })).toBe("Мария");
    });

    // Additional: Leading/trailing whitespace in stored display_name is trimmed for display
    it("display_name with surrounding whitespace is trimmed", () => {
        expect(resolveAuthorName({ display_name: "  Алекс  " })).toBe("Алекс");
    });
});
