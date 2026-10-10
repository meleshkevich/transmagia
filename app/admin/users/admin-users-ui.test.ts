import { describe, expect, it } from "vitest";

import type { AdminUser } from "@/lib/admin/users";

// ─── Date formatting ──────────────────────────────────────────────────────────

const dateFormat = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
});

describe("Registration date format", () => {
    it("formats to DD/MM/YYYY — example 1", () => {
        expect(dateFormat.format(new Date("2026-10-01T09:15:00Z"))).toBe("01/10/2026");
    });

    it("formats to DD/MM/YYYY — example 2", () => {
        expect(dateFormat.format(new Date("2026-09-24T16:30:00Z"))).toBe("24/09/2026");
    });

    it("uses two digits for single-digit day and month", () => {
        const result = dateFormat.format(new Date("2026-01-05T00:00:00Z"));
        expect(result).toBe("05/01/2026");
    });

    it("contains no time component (no colon-separated digits)", () => {
        const result = dateFormat.format(new Date("2026-10-01T09:15:00Z"));
        expect(result).not.toMatch(/\d{1,2}:\d{2}/);
    });

    it("handles invalid date gracefully (NaN check pattern)", () => {
        const d = new Date("not-a-date");
        expect(isNaN(d.getTime())).toBe(true);
    });
});

// ─── AdminUser type: emailConfirmedAt field ───────────────────────────────────

describe("AdminUser type — emailConfirmedAt", () => {
    it("includes emailConfirmedAt as string | null", () => {
        const confirmed: AdminUser = {
            id: "1",
            email: "a@example.com",
            emailConfirmedAt: "2026-10-01T09:00:00Z",
            displayName: null,
            isAdmin: false,
            createdAt: "2026-10-01T09:00:00Z",
        };
        expect(confirmed.emailConfirmedAt).toBe("2026-10-01T09:00:00Z");
    });

    it("emailConfirmedAt may be null for unconfirmed users", () => {
        const unconfirmed: AdminUser = {
            id: "2",
            email: "b@example.com",
            emailConfirmedAt: null,
            displayName: null,
            isAdmin: false,
            createdAt: "2026-10-01T09:00:00Z",
        };
        expect(unconfirmed.emailConfirmedAt).toBeNull();
    });

    it("verification icon condition: truthy only when emailConfirmedAt is a non-empty value", () => {
        // Mirrors the JSX render condition: {u.emailConfirmedAt && <Icon />}
        const showIcon = (v: string | null | undefined): boolean => Boolean(v);
        expect(showIcon("2026-10-01T09:00:00Z")).toBe(true);
        expect(showIcon(null)).toBe(false);
        expect(showIcon(undefined)).toBe(false);
    });
});
