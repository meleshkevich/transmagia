import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../..");

function readSource(relativePath: string): string {
    return readFileSync(join(ROOT, relativePath), "utf-8");
}

// ─── 1. Privacy policy page exists and is publicly accessible ────────────────

describe("privacy policy page", () => {
    it("app/privacy/page.tsx exists", () => {
        expect(existsSync(join(ROOT, "app/privacy/page.tsx"))).toBe(true);
    });

    it("page does not import requireAdmin or any auth gate", () => {
        const src = readSource("app/privacy/page.tsx");
        expect(src).not.toMatch(/requireAdmin/);
        expect(src).not.toMatch(/requireAuth/);
        expect(src).not.toMatch(/redirect.*login/i);
    });

    it("page title is in Russian", () => {
        const src = readSource("app/privacy/page.tsx");
        expect(src).toContain("Политика конфиденциальности");
    });

    it("page includes all required sections", () => {
        const src = readSource("app/privacy/page.tsx");
        expect(src).toContain("Общие положения");
        expect(src).toContain("Кто отвечает за обработку данных");
        expect(src).toContain("Какие данные мы обрабатываем");
        expect(src).toContain("Для чего используются данные");
        expect(src).toContain("Правовые основания обработки");
        expect(src).toContain("Где и кем обрабатываются данные");
        expect(src).toContain("Использование cookies");
        expect(src).toContain("Сроки хранения данных");
        expect(src).toContain("Удаление аккаунта");
        expect(src).toContain("Права пользователей");
        expect(src).toContain("Как связаться с нами");
        expect(src).toContain("Изменения политики");
    });

    it("page names the data controller", () => {
        const src = readSource("app/privacy/page.tsx");
        expect(src).toContain("Ив Венс Шер");
    });

    it("page contains the privacy contact email as a mailto link", () => {
        const src = readSource("app/privacy/page.tsx");
        expect(src).toContain("mailto:iv.venscher@gmail.com");
        expect(src).toContain("iv.venscher@gmail.com");
    });

    it("page states the Supabase region correctly", () => {
        const src = readSource("app/privacy/page.tsx");
        expect(src).toContain("Великобритания");
        // Must not claim London is in the EU
        expect(src).not.toMatch(/Лондон.*Европейск/);
        expect(src).not.toMatch(/Лондон.*ЕС/);
    });

    it("page contains no unresolved placeholders", () => {
        const src = readSource("app/privacy/page.tsx");
        expect(src).not.toContain("[Указать");
        expect(src).not.toContain("[Уточнить");
    });
});

// ─── 2. Footer contains privacy link ────────────────────────────────────────

describe("footer privacy link", () => {
    it("homepage footer links to /privacy", () => {
        const src = readSource("app/page.tsx");
        expect(src).toContain('href="/privacy"');
        expect(src).toContain("Политика конфиденциальности");
    });

    it("homepage footer still contains existing Rules and Contacts links", () => {
        const src = readSource("app/page.tsx");
        expect(src).toContain('href="/rules"');
        expect(src).toContain('href="/contacts"');
    });
});

// ─── 3. Registration form privacy notice ────────────────────────────────────

describe("registration privacy notice in source", () => {
    it("auth-form.tsx links to /privacy", () => {
        const src = readSource("components/auth/auth-form.tsx");
        expect(src).toContain('href="/privacy"');
    });

    it("auth-form.tsx contains the Russian privacy notice text", () => {
        const src = readSource("components/auth/auth-form.tsx");
        expect(src).toContain("Политикой конфиденциальности");
    });

    it("auth-form.tsx does NOT add a required checkbox for privacy consent", () => {
        const src = readSource("components/auth/auth-form.tsx");
        // No checkbox tied to a consent or privacy requirement
        expect(src).not.toMatch(/type="checkbox".*privacy/i);
        expect(src).not.toMatch(/type="checkbox".*consent/i);
        expect(src).not.toMatch(/type="checkbox".*конфиденциальност/i);
    });

    it("registration server action is unchanged — no consent parameter added", () => {
        const src = readSource("app/actions/auth.ts");
        // The signUp action must not reference any consent or privacy acceptance field
        expect(src).not.toMatch(/consent/i);
        expect(src).not.toMatch(/privacy.*accepted/i);
        expect(src).not.toMatch(/policy.*accepted/i);
    });
});

// ─── 4. No analytics or tracking code introduced ────────────────────────────

describe("no analytics or tracking code", () => {
    it("layout.tsx contains no analytics imports or script tags", () => {
        const src = readSource("app/layout.tsx");
        expect(src).not.toMatch(/gtag|google-analytics|googletagmanager/i);
        expect(src).not.toMatch(/@vercel\/analytics|@vercel\/speed-insights/i);
        expect(src).not.toMatch(/fbq|meta.*pixel|facebook/i);
        expect(src).not.toMatch(/sentry/i);
        expect(src).not.toMatch(/hotjar|clarity|mixpanel|posthog/i);
        expect(src).not.toMatch(/<Script/);
    });

    it("package.json contains no analytics packages", () => {
        const pkg = JSON.parse(readSource("package.json")) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
        };
        const allDeps = Object.keys({
            ...pkg.dependencies,
            ...pkg.devDependencies,
        });
        const analyticsPackages = [
            "@vercel/analytics",
            "@vercel/speed-insights",
            "posthog-js",
            "mixpanel-browser",
            "hotjar",
            "@sentry/nextjs",
            "react-ga",
            "react-ga4",
        ];
        for (const pkg of analyticsPackages) {
            expect(allDeps, `unexpected analytics package: ${pkg}`).not.toContain(pkg);
        }
    });
});

// ─── 5. No cookie consent banner introduced ──────────────────────────────────

describe("no cookie consent banner", () => {
    it("no CookieBanner or CookieConsent component file exists", () => {
        expect(existsSync(join(ROOT, "components/cookie-banner.tsx"))).toBe(false);
        expect(existsSync(join(ROOT, "components/cookie-consent.tsx"))).toBe(false);
        expect(existsSync(join(ROOT, "components/ui/cookie-banner.tsx"))).toBe(false);
    });

    it("layout.tsx does not render a cookie banner component", () => {
        const src = readSource("app/layout.tsx");
        expect(src).not.toMatch(/CookieBanner|CookieConsent|cookie-banner/i);
    });
});

// ─── 6. Account deletion — anonymization of comments ────────────────────────
//
// Duplicated here as a GDPR-specific invariant assertion separate from the
// content-survival tests in lib/admin/user-deletion-policy.test.ts

describe("account deletion — GDPR anonymization", () => {
    it("comments FK uses ON DELETE SET NULL (comments anonymized, not deleted)", () => {
        const sql = readFileSync(
            join(ROOT, "supabase/migrations/20260922010000_preserve_comments_on_user_delete.sql"),
            "utf-8",
        );
        expect(sql).toMatch(/on\s+delete\s+set\s+null/i);
    });

    it("chapter_read_progress FK uses ON DELETE CASCADE (progress deleted with account)", () => {
        const migrations = readFileSync(
            join(ROOT, "supabase/migrations/20261008000000_chapter_read_progress.sql"),
            "utf-8",
        );
        expect(migrations).toMatch(/on\s+delete\s+cascade/i);
    });
});
