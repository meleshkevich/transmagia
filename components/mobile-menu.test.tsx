// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MobileMenu } from "./mobile-menu";

afterEach(() => {
    cleanup();
});

describe("MobileMenu — registration link", () => {
    it("does not contain a registration link (guest)", () => {
        render(<MobileMenu isAuthenticated={false} />);
        fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
        expect(screen.queryByRole("link", { name: /зарегистрир/i })).toBeNull();
    });

    it("does not contain a registration link (authenticated)", () => {
        render(<MobileMenu isAuthenticated={true} />);
        fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
        expect(screen.queryByRole("link", { name: /зарегистрир/i })).toBeNull();
    });
});

describe("MobileMenu — open/close", () => {
    it("menu is closed by default", () => {
        render(<MobileMenu isAuthenticated={false} />);
        expect(screen.queryByRole("navigation", { name: "Мобильная навигация" })).toBeNull();
    });

    it("clicking the button opens the menu", () => {
        render(<MobileMenu isAuthenticated={false} />);
        fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
        expect(screen.getByRole("navigation", { name: "Мобильная навигация" })).toBeInTheDocument();
    });

    it("clicking the button again closes the menu", () => {
        render(<MobileMenu isAuthenticated={false} />);
        fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
        fireEvent.click(screen.getByRole("button", { name: "Закрыть меню" }));
        expect(screen.queryByRole("navigation", { name: "Мобильная навигация" })).toBeNull();
    });

    it("button aria-expanded reflects menu state", () => {
        render(<MobileMenu isAuthenticated={false} />);
        const btn = screen.getByRole("button", { name: "Открыть меню" });
        expect(btn).toHaveAttribute("aria-expanded", "false");
        fireEvent.click(btn);
        expect(screen.getByRole("button", { name: "Закрыть меню" })).toHaveAttribute("aria-expanded", "true");
    });
});

describe("MobileMenu — navigation links", () => {
    it("shows navigation links when open", () => {
        render(<MobileMenu isAuthenticated={false} />);
        fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
        expect(screen.getByRole("link", { name: "Правила пользования сайтом" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Контакты" })).toBeInTheDocument();
    });

    it("Контакты link navigates to /contacts", () => {
        render(<MobileMenu isAuthenticated={false} />);
        fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
        expect(screen.getByRole("link", { name: "Контакты" })).toHaveAttribute("href", "/contacts");
    });
});

describe("MobileMenu — Мои книги", () => {
    it("shows Мои книги when authenticated", () => {
        render(<MobileMenu isAuthenticated={true} />);
        fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
        expect(screen.getByRole("link", { name: "Мои книги" })).toBeInTheDocument();
    });

    it("does not show Мои книги when not authenticated", () => {
        render(<MobileMenu isAuthenticated={false} />);
        fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
        expect(screen.queryByRole("link", { name: "Мои книги" })).toBeNull();
    });

    it("Мои книги link navigates to /my-books", () => {
        render(<MobileMenu isAuthenticated={true} />);
        fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
        expect(screen.getByRole("link", { name: "Мои книги" })).toHaveAttribute("href", "/my-books");
    });

    it("clicking Мои книги closes the menu", () => {
        render(<MobileMenu isAuthenticated={true} />);
        fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
        fireEvent.click(screen.getByRole("link", { name: "Мои книги" }));
        expect(screen.queryByRole("navigation", { name: "Мобильная навигация" })).toBeNull();
    });
});
