// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/server", () => ({
    getCurrentProfile: vi.fn(),
}));
vi.mock("@/components/auth/logout-form", () => ({
    LogoutForm: () => <button aria-label="Выйти" type="submit">logout</button>,
}));

import { getCurrentProfile } from "@/lib/auth/server";
import { AuthNav } from "./auth-nav";

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

async function renderAuthNav() {
    const element = await AuthNav();
    return render(element as React.ReactElement);
}

// ─── Guest state ──────────────────────────────────────────────────────────────

describe("AuthNav — guest", () => {
    beforeEach(() => {
        vi.mocked(getCurrentProfile).mockResolvedValue(null);
    });

    it("shows the login link", async () => {
        await renderAuthNav();
        expect(screen.getByRole("link", { name: "Войти" })).toBeInTheDocument();
    });

    it("login link navigates to /login", async () => {
        await renderAuthNav();
        expect(screen.getByRole("link", { name: "Войти" })).toHaveAttribute("href", "/login");
    });

    it("login link has title tooltip in Russian", async () => {
        await renderAuthNav();
        expect(screen.getByRole("link", { name: "Войти" })).toHaveAttribute("title", "Войти");
    });

    it("does not show a registration link", async () => {
        await renderAuthNav();
        expect(screen.queryByRole("link", { name: /зарегистрир/i })).toBeNull();
    });

    it("does not show logout", async () => {
        await renderAuthNav();
        expect(screen.queryByRole("button", { name: "Выйти" })).toBeNull();
    });

    it("login link contains a LogIn icon (svg)", async () => {
        const { container } = await renderAuthNav();
        expect(container.querySelector("svg")).toBeInTheDocument();
    });
});

// ─── Authenticated state ──────────────────────────────────────────────────────

describe("AuthNav — authenticated non-admin", () => {
    beforeEach(() => {
        vi.mocked(getCurrentProfile).mockResolvedValue({
            id: "user-1",
            is_admin: false,
            display_name: "Тест",
        });
    });

    it("does not show login link", async () => {
        await renderAuthNav();
        expect(screen.queryByRole("link", { name: "Войти" })).toBeNull();
    });

    it("does not show registration link", async () => {
        await renderAuthNav();
        expect(screen.queryByRole("link", { name: /зарегистрир/i })).toBeNull();
    });

    it("shows logout", async () => {
        await renderAuthNav();
        expect(screen.getByRole("button", { name: "Выйти" })).toBeInTheDocument();
    });

    it("does not show Админка for non-admin", async () => {
        await renderAuthNav();
        expect(screen.queryByRole("link", { name: "Админка" })).toBeNull();
    });
});

describe("AuthNav — authenticated admin", () => {
    beforeEach(() => {
        vi.mocked(getCurrentProfile).mockResolvedValue({
            id: "admin-1",
            is_admin: true,
            display_name: "Админ",
        });
    });

    it("shows Админка link for admin", async () => {
        await renderAuthNav();
        expect(screen.getByRole("link", { name: "Админка" })).toBeInTheDocument();
    });

    it("shows logout for admin", async () => {
        await renderAuthNav();
        expect(screen.getByRole("button", { name: "Выйти" })).toBeInTheDocument();
    });
});
