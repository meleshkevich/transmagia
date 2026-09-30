// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./confirm-dialog";
import { PromptDialog } from "./prompt-dialog";

// jsdom has limited showModal support; stub it so tests control open state.
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

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

describe("ConfirmDialog", () => {
    type Props = Parameters<typeof ConfirmDialog>[0];

    function renderDialog(props: Partial<Props> = {}) {
        const defaults: Props = {
            open: true,
            onClose: vi.fn(),
            onConfirm: vi.fn(),
            title: "Подтвердить?",
            ...props,
        };
        render(<ConfirmDialog {...defaults} />);
        return { onClose: defaults.onClose, onConfirm: defaults.onConfirm };
    }

    it("renders title when open", () => {
        renderDialog({ title: "Удалить пользователя?" });
        expect(screen.getByText("Удалить пользователя?")).toBeInTheDocument();
    });

    it("renders description when provided", () => {
        renderDialog({ description: "Действие нельзя отменить." });
        expect(screen.getByText("Действие нельзя отменить.")).toBeInTheDocument();
    });

    it("calls onConfirm when confirm button is clicked", () => {
        const { onConfirm } = renderDialog({ confirmLabel: "Удалить" });
        fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
        expect(onConfirm).toHaveBeenCalledOnce();
    });

    it("calls onClose when cancel button is clicked", () => {
        const { onClose } = renderDialog();
        fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("does NOT call onConfirm when cancel button is clicked", () => {
        const { onConfirm } = renderDialog();
        fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("disables both buttons when loading=true", () => {
        renderDialog({ loading: true, confirmLabel: "Удалить" });
        for (const btn of screen.getAllByRole("button")) {
            expect(btn).toBeDisabled();
        }
    });

    it("shows '…' on confirm button and hides label while loading", () => {
        renderDialog({ loading: true, confirmLabel: "Удалить" });
        expect(screen.queryByRole("button", { name: "Удалить" })).toBeNull();
        expect(screen.getByText("…")).toBeInTheDocument();
    });

    it("prevents duplicate submission — confirm button is disabled while loading", () => {
        const { onConfirm } = renderDialog({ loading: true });
        const busyBtn = screen.getAllByRole("button").find((b) => b.getAttribute("aria-busy") === "true");
        expect(busyBtn).toBeDisabled();
        if (busyBtn) fireEvent.click(busyBtn);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("shows error message when errorMessage is provided", () => {
        renderDialog({ errorMessage: "Не удалось удалить." });
        expect(screen.getByRole("alert")).toHaveTextContent("Не удалось удалить.");
    });

    it("renders confirm button with destructive data-variant when destructive=true", () => {
        renderDialog({ destructive: true, confirmLabel: "Удалить" });
        expect(screen.getByRole("button", { name: "Удалить" })).toHaveAttribute("data-variant", "destructive");
    });

    it("renders confirm button with default data-variant when destructive=false", () => {
        renderDialog({ destructive: false, confirmLabel: "Подтвердить" });
        expect(screen.getByRole("button", { name: "Подтвердить" })).toHaveAttribute("data-variant", "default");
    });

    it("dialog is not open when open=false", () => {
        renderDialog({ open: false });
        expect(document.querySelector("dialog")).not.toHaveAttribute("open");
    });

    it("has accessible title via aria-labelledby", () => {
        renderDialog({ title: "Заголовок" });
        const dialog = document.querySelector("dialog")!;
        const labelId = dialog.getAttribute("aria-labelledby")!;
        expect(document.getElementById(labelId)?.textContent).toBe("Заголовок");
    });

    it("Escape key triggers onClose via onCancel handler", () => {
        const { onClose } = renderDialog();
        const dialog = document.querySelector("dialog")!;
        // Fire the cancel event that browsers emit for Escape
        fireEvent(dialog, new Event("cancel", { bubbles: false }));
        expect(onClose).toHaveBeenCalledOnce();
    });
});

// ─── PromptDialog ─────────────────────────────────────────────────────────────

describe("PromptDialog", () => {
    type Props = Parameters<typeof PromptDialog>[0];

    function renderPrompt(props: Partial<Props> = {}) {
        const defaults: Props = {
            open: true,
            onClose: vi.fn(),
            onConfirm: vi.fn(),
            title: "Вставить ссылку",
            label: "URL",
            ...props,
        };
        render(<PromptDialog {...defaults} />);
        return { onClose: defaults.onClose, onConfirm: defaults.onConfirm };
    }

    it("shows validation error for empty input on submit", () => {
        renderPrompt();
        fireEvent.submit(screen.getByRole("textbox").closest("form")!);
        expect(screen.getByRole("alert")).toHaveTextContent("Введите ссылку.");
    });

    it("does not call onConfirm when submitted with empty value", () => {
        const { onConfirm } = renderPrompt();
        fireEvent.submit(screen.getByRole("textbox").closest("form")!);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("calls onConfirm with trimmed value on valid submit", async () => {
        const { onConfirm } = renderPrompt();
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "https://example.com " } });
        fireEvent.submit(screen.getByRole("textbox").closest("form")!);
        await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("https://example.com"));
    });

    it("calls onClose when cancel button is clicked", () => {
        const { onClose } = renderPrompt();
        fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it("does not call onConfirm when cancel is clicked", () => {
        const { onConfirm } = renderPrompt();
        fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("clears validation error when user starts typing", async () => {
        renderPrompt();
        // Trigger error
        fireEvent.submit(screen.getByRole("textbox").closest("form")!);
        expect(screen.getByRole("alert")).toBeInTheDocument();
        // Type something → error should clear
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "h" } });
        await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    });

    it("pre-fills input with initialValue", () => {
        renderPrompt({ initialValue: "https://existing.com" });
        expect(screen.getByRole("textbox")).toHaveValue("https://existing.com");
    });

    it("has a label associated with the input via htmlFor/id", () => {
        renderPrompt({ label: "Адрес ссылки" });
        expect(screen.getByLabelText("Адрес ссылки")).toBeInTheDocument();
    });
});
