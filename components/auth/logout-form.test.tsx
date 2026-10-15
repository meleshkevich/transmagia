// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/auth", () => ({
    signOut: vi.fn(),
}));

import { LogoutForm } from "./logout-form";

afterEach(() => {
    cleanup();
});

describe("LogoutForm", () => {
    it("renders a submit button", () => {
        render(<LogoutForm />);
        expect(screen.getByRole("button")).toBeInTheDocument();
        expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });

    it("button has accessible label in Russian", () => {
        render(<LogoutForm />);
        expect(screen.getByRole("button", { name: "Выйти" })).toBeInTheDocument();
    });

    it("button has title tooltip in Russian", () => {
        render(<LogoutForm />);
        expect(screen.getByRole("button", { name: "Выйти" })).toHaveAttribute("title", "Выйти");
    });

    it("button contains a LogOut icon (svg)", () => {
        const { container } = render(<LogoutForm />);
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("button does not show visible text label", () => {
        render(<LogoutForm />);
        expect(screen.getByRole("button", { name: "Выйти" }).textContent).toBe("");
    });

    it("is wrapped in a form element", () => {
        const { container } = render(<LogoutForm />);
        expect(container.querySelector("form")).toBeInTheDocument();
    });
});
