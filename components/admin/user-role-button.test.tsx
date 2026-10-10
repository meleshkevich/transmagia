// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { adminDemoteUserAction, adminPromoteUserAction } from "@/app/actions/admin-users";

import { UserRoleButton } from "./user-role-button";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/actions/admin-users", () => ({
    adminDemoteUserAction: vi.fn().mockResolvedValue({}),
    adminPromoteUserAction: vi.fn().mockResolvedValue({}),
    adminDeleteUserAction: vi.fn().mockResolvedValue({}),
}));

beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute("open", "");
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
        this.removeAttribute("open");
    });
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderRole(overrides: { isCurrentlyAdmin?: boolean; isSelf?: boolean } = {}) {
    const props = { userId: "test-id", isCurrentlyAdmin: false, isSelf: false, ...overrides };
    const result = render(<UserRoleButton {...props} />);
    return { ...props, container: result.container };
}

// ─── Icon selection ───────────────────────────────────────────────────────────

describe("UserRoleButton — icon and label", () => {
    it("shows ShieldMinus button when user is already admin", () => {
        renderRole({ isCurrentlyAdmin: true });
        const btn = screen.getByRole("button", { name: "Снять права администратора" });
        expect(btn).toBeInTheDocument();
    });

    it("shows ShieldPlus button when user is not admin", () => {
        renderRole({ isCurrentlyAdmin: false });
        const btn = screen.getByRole("button", { name: "Сделать администратором" });
        expect(btn).toBeInTheDocument();
    });

    it("aria-label for demotion is in Russian", () => {
        renderRole({ isCurrentlyAdmin: true });
        expect(screen.getByRole("button", { name: "Снять права администратора" })).toBeInTheDocument();
    });

    it("aria-label for promotion is in Russian", () => {
        renderRole({ isCurrentlyAdmin: false });
        expect(screen.getByRole("button", { name: "Сделать администратором" })).toBeInTheDocument();
    });
});

// ─── Disabled / self-protection ───────────────────────────────────────────────

describe("UserRoleButton — disabled state", () => {
    it("button is disabled when current user is admin viewing their own row", () => {
        renderRole({ isCurrentlyAdmin: true, isSelf: true });
        expect(screen.getByRole("button", { name: "Снять права администратора" })).toBeDisabled();
    });

    it("disabled button has title explaining the restriction", () => {
        renderRole({ isCurrentlyAdmin: true, isSelf: true });
        const btn = screen.getByRole("button", { name: "Снять права администратора" });
        expect(btn).toHaveAttribute("title", "Нельзя снять права администратора у самого себя");
    });

    it("non-self admin button is enabled", () => {
        renderRole({ isCurrentlyAdmin: true, isSelf: false });
        expect(screen.getByRole("button", { name: "Снять права администратора" })).not.toBeDisabled();
    });
});

// ─── Confirmation dialog ──────────────────────────────────────────────────────

describe("UserRoleButton — confirmation dialog", () => {
    it("clicking opens confirm dialog for demotion", () => {
        renderRole({ isCurrentlyAdmin: true });
        fireEvent.click(screen.getByRole("button", { name: "Снять права администратора" }));
        expect(screen.getByText("Снять права администратора?")).toBeInTheDocument();
    });

    it("clicking opens confirm dialog for promotion", () => {
        renderRole({ isCurrentlyAdmin: false });
        fireEvent.click(screen.getByRole("button", { name: "Сделать администратором" }));
        expect(screen.getByText("Назначить администратором?")).toBeInTheDocument();
    });

    it("confirming demotion calls adminDemoteUserAction", async () => {
        renderRole({ isCurrentlyAdmin: true });
        fireEvent.click(screen.getByRole("button", { name: "Снять права администратора" }));
        fireEvent.click(screen.getByRole("button", { name: "Снять права" }));
        await vi.waitFor(() => {
            expect(vi.mocked(adminDemoteUserAction)).toHaveBeenCalledWith("test-id");
        });
    });

    it("confirming promotion calls adminPromoteUserAction", async () => {
        renderRole({ isCurrentlyAdmin: false });
        fireEvent.click(screen.getByRole("button", { name: "Сделать администратором" }));
        fireEvent.click(screen.getByRole("button", { name: "Назначить" }));
        await vi.waitFor(() => {
            expect(vi.mocked(adminPromoteUserAction)).toHaveBeenCalledWith("test-id");
        });
    });
});

// ─── Icon color ───────────────────────────────────────────────────────────────

describe("UserRoleButton — icon color", () => {
    it("ShieldPlus icon has a green color class", () => {
        const { container } = renderRole({ isCurrentlyAdmin: false });
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("class")).toMatch(/text-green/);
    });

    it("ShieldMinus icon does not have a green color class", () => {
        const { container } = renderRole({ isCurrentlyAdmin: true });
        const svg = container.querySelector("svg");
        expect(svg?.getAttribute("class") ?? "").not.toMatch(/text-green/);
    });

    it("disabled ShieldMinus (self-demotion) is visually muted via disabled attribute", () => {
        renderRole({ isCurrentlyAdmin: true, isSelf: true });
        const btn = screen.getByRole("button", { name: "Снять права администратора" });
        expect(btn).toBeDisabled();
    });

    it("active ShieldMinus button (other admin) is not disabled", () => {
        renderRole({ isCurrentlyAdmin: true, isSelf: false });
        expect(screen.getByRole("button", { name: "Снять права администратора" })).not.toBeDisabled();
    });
});
