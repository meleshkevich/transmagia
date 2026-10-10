// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { adminDeleteUserAction } from "@/app/actions/admin-users";

import { DeleteUserButton } from "./delete-user-button";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/actions/admin-users", () => ({
    adminDeleteUserAction: vi.fn().mockResolvedValue({}),
    adminDemoteUserAction: vi.fn().mockResolvedValue({}),
    adminPromoteUserAction: vi.fn().mockResolvedValue({}),
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

function renderDelete(isSelf = false) {
    render(<DeleteUserButton userId="target-id" isSelf={isSelf} />);
}

// ─── Icon and accessible label ────────────────────────────────────────────────

describe("DeleteUserButton — icon and label", () => {
    it("renders a button with aria-label Удалить пользователя", () => {
        renderDelete();
        expect(screen.getByRole("button", { name: "Удалить пользователя" })).toBeInTheDocument();
    });

    it("button has title tooltip", () => {
        renderDelete();
        expect(screen.getByRole("button", { name: "Удалить пользователя" })).toHaveAttribute(
            "title",
            "Удалить пользователя",
        );
    });
});

// ─── Self-protection ──────────────────────────────────────────────────────────

describe("DeleteUserButton — self-protection", () => {
    it("button is disabled when isSelf=true", () => {
        renderDelete(true);
        expect(screen.getByRole("button", { name: "Удалить пользователя" })).toBeDisabled();
    });

    it("disabled button has title explaining the restriction", () => {
        renderDelete(true);
        expect(screen.getByRole("button", { name: "Удалить пользователя" })).toHaveAttribute(
            "title",
            "Нельзя удалить собственную учётную запись",
        );
    });

    it("button is enabled when isSelf=false", () => {
        renderDelete(false);
        expect(screen.getByRole("button", { name: "Удалить пользователя" })).not.toBeDisabled();
    });
});

// ─── Confirmation dialog ──────────────────────────────────────────────────────

describe("DeleteUserButton — confirmation dialog", () => {
    it("clicking opens confirm dialog (not native confirm)", () => {
        renderDelete();
        fireEvent.click(screen.getByRole("button", { name: "Удалить пользователя" }));
        expect(screen.getByText("Удалить пользователя?")).toBeInTheDocument();
    });

    it("dialog renders destructive confirm button", () => {
        renderDelete();
        fireEvent.click(screen.getByRole("button", { name: "Удалить пользователя" }));
        const confirmBtn = screen.getByRole("button", { name: "Удалить" });
        expect(confirmBtn).toHaveAttribute("data-variant", "destructive");
    });

    it("confirming calls adminDeleteUserAction with the target userId", async () => {
        renderDelete();
        fireEvent.click(screen.getByRole("button", { name: "Удалить пользователя" }));
        fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
        await vi.waitFor(() => {
            expect(vi.mocked(adminDeleteUserAction)).toHaveBeenCalledWith("target-id");
        });
    });

    it("disabled button does not open dialog when isSelf=true", () => {
        renderDelete(true);
        fireEvent.click(screen.getByRole("button", { name: "Удалить пользователя" }));
        expect(screen.queryByText("Удалить пользователя?")).toBeNull();
    });
});
