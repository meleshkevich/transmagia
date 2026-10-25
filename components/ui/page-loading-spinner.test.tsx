// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PageLoadingSpinner } from "./page-loading-spinner";

afterEach(() => {
    cleanup();
});

describe("PageLoadingSpinner", () => {
    it("renders without crashing", () => {
        render(<PageLoadingSpinner />);
        expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("has an accessible label in Russian", () => {
        render(<PageLoadingSpinner />);
        expect(screen.getByRole("status", { name: "Загрузка..." })).toBeInTheDocument();
    });

    it("includes sr-only text for screen readers", () => {
        render(<PageLoadingSpinner />);
        expect(screen.getByText("Загрузка...")).toBeInTheDocument();
    });

    it("contains a spinner icon (svg)", () => {
        const { container } = render(<PageLoadingSpinner />);
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("spinner icon has animate-spin class", () => {
        const { container } = render(<PageLoadingSpinner />);
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("class")).toMatch(/animate-spin/);
    });

    it("spinner icon has text-primary class", () => {
        const { container } = render(<PageLoadingSpinner />);
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("class")).toMatch(/text-primary/);
    });

    it("spinner icon is aria-hidden", () => {
        const { container } = render(<PageLoadingSpinner />);
        const svg = container.querySelector("svg");
        expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("accepts a custom className", () => {
        const { container } = render(<PageLoadingSpinner className="custom-class" />);
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.className).toContain("custom-class");
    });

    it("accepts a custom size", () => {
        const { container } = render(<PageLoadingSpinner size={48} />);
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
    });
});

describe("Loading route boundaries render PageLoadingSpinner", () => {
    it("does not expose protected content in loading placeholder", () => {
        render(<PageLoadingSpinner />);
        // Loading indicator should only contain spinner + accessible label
        expect(screen.queryByText(/список пользователей/i)).toBeNull();
        expect(screen.queryByText(/email/i)).toBeNull();
        expect(screen.queryByText(/пароль/i)).toBeNull();
    });
});
