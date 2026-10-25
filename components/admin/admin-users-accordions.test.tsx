// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { adminGetUsersAction } from "@/app/actions/admin-users";

import { AdminUsersAccordions } from "./admin-users-accordions";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/actions/admin-users", () => ({
    adminGetUsersAction: vi.fn().mockResolvedValue({ users: [] }),
    adminCreateUserAction: vi.fn().mockResolvedValue({}),
    adminDeleteUserAction: vi.fn().mockResolvedValue({ success: true }),
    adminDemoteUserAction: vi.fn().mockResolvedValue({ success: true }),
    adminPromoteUserAction: vi.fn().mockResolvedValue({ success: true }),
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

function renderAccordions(currentUserId = "admin-id") {
    return render(<AdminUsersAccordions currentUserId={currentUserId} />);
}

const TEST_USERS = [
    {
        id: "user-1",
        email: "alice@example.com",
        emailConfirmedAt: "2026-01-01T00:00:00Z",
        displayName: "Alice",
        isAdmin: false,
        createdAt: "2026-01-01T00:00:00Z",
    },
    {
        id: "admin-id",
        email: "admin@example.com",
        emailConfirmedAt: "2026-01-01T00:00:00Z",
        displayName: "Admin",
        isAdmin: true,
        createdAt: "2026-01-01T00:00:00Z",
    },
];

// ─── Initial state ─────────────────────────────────────────────────────────

describe("Accordions — initial state", () => {
    it("Create User accordion is collapsed initially", () => {
        renderAccordions();
        const trigger = screen.getByRole("button", { name: "Создать пользователя" });
        expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("Users List accordion is collapsed initially", () => {
        renderAccordions();
        const trigger = screen.getByRole("button", { name: "Список пользователей" });
        expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("does not fetch users on initial render", () => {
        renderAccordions();
        expect(vi.mocked(adminGetUsersAction)).not.toHaveBeenCalled();
    });
});

// ─── Create User accordion ────────────────────────────────────────────────

describe("Create User accordion — open/close", () => {
    it("opens when trigger is clicked", () => {
        renderAccordions();
        // Store the trigger reference before clicking (form submit button appears after open with same name)
        const trigger = screen.getByRole("button", { name: "Создать пользователя" });
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("exposes the form fields when open", () => {
        renderAccordions();
        const trigger = screen.getByRole("button", { name: "Создать пользователя" });
        fireEvent.click(trigger);
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/пароль$/i)).toBeInTheDocument();
    });

    it("collapses when trigger is clicked again", () => {
        renderAccordions();
        const trigger = screen.getByRole("button", { name: "Создать пользователя" });
        fireEvent.click(trigger); // open
        fireEvent.click(trigger); // close
        expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
});

// ─── Users List accordion — open/close ────────────────────────────────────

describe("Users List accordion — open/close", () => {
    it("opens when trigger is clicked", async () => {
        renderAccordions();
        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        expect(screen.getByRole("button", { name: "Список пользователей" })).toHaveAttribute("aria-expanded", "true");
    });

    it("collapses when trigger is clicked again", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({ users: [] });
        renderAccordions();
        const trigger = screen.getByRole("button", { name: "Список пользователей" });
        fireEvent.click(trigger);
        await waitFor(() => expect(vi.mocked(adminGetUsersAction)).toHaveBeenCalledTimes(1));
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
});

// ─── Lazy loading behaviour ────────────────────────────────────────────────

describe("Users List — lazy loading", () => {
    it("does not fetch users until the list accordion is opened", () => {
        renderAccordions();
        // Only open the create form, not the list
        fireEvent.click(screen.getByRole("button", { name: "Создать пользователя" }));
        expect(vi.mocked(adminGetUsersAction)).not.toHaveBeenCalled();
    });

    it("fetches users when the list accordion is opened", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({ users: [] });
        renderAccordions();
        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => {
            expect(vi.mocked(adminGetUsersAction)).toHaveBeenCalledTimes(1);
        });
    });

    it("shows loading spinner while fetching", async () => {
        let resolve!: (v: { users: typeof TEST_USERS }) => void;
        vi.mocked(adminGetUsersAction).mockReturnValue(new Promise((r) => { resolve = r; }) as never);

        renderAccordions();
        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));

        expect(screen.getByRole("status", { name: "Загрузка..." })).toBeInTheDocument();

        resolve({ users: TEST_USERS });
    });

    it("renders the table after a successful fetch", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({ users: TEST_USERS });
        renderAccordions();
        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => {
            expect(screen.getByText("alice@example.com")).toBeInTheDocument();
        });
    });

    it("renders empty state when user list is empty", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({ users: [] });
        renderAccordions();
        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => {
            expect(screen.getByText("Пользователей пока нет.")).toBeInTheDocument();
        });
    });
});

// ─── Error state ──────────────────────────────────────────────────────────

describe("Users List — error state", () => {
    it("displays a Russian error message when fetch fails", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({
            error: "Не удалось загрузить список пользователей.",
        });
        renderAccordions();
        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => {
            expect(screen.getByText("Не удалось загрузить список пользователей.")).toBeInTheDocument();
        });
    });

    it("error message has role=alert", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({
            error: "Не удалось загрузить список пользователей.",
        });
        renderAccordions();
        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => {
            expect(screen.getByRole("alert")).toBeInTheDocument();
        });
    });

    it("accordion stays open after fetch failure", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({
            error: "Не удалось загрузить список пользователей.",
        });
        renderAccordions();
        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => screen.getByRole("alert"));
        expect(screen.getByRole("button", { name: "Список пользователей" })).toHaveAttribute("aria-expanded", "true");
    });

    it("shows a retry button after failure", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({
            error: "Не удалось загрузить список пользователей.",
        });
        renderAccordions();
        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();
        });
    });

    it("retry button triggers a new fetch", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({
            error: "Не удалось загрузить список пользователей.",
        });
        renderAccordions();
        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => screen.getByRole("button", { name: "Повторить" }));

        vi.mocked(adminGetUsersAction).mockResolvedValue({ users: [] });
        fireEvent.click(screen.getByRole("button", { name: "Повторить" }));

        await waitFor(() => {
            expect(vi.mocked(adminGetUsersAction)).toHaveBeenCalledTimes(2);
        });
    });
});

// ─── Cache behaviour ──────────────────────────────────────────────────────

describe("Users List — cache behaviour", () => {
    it("does not refetch on close and reopen when data is fresh", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({ users: [] });
        renderAccordions();

        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => expect(vi.mocked(adminGetUsersAction)).toHaveBeenCalledTimes(1));

        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));

        await waitFor(() => expect(vi.mocked(adminGetUsersAction)).toHaveBeenCalledTimes(1));
    });
});

// ─── Refresh after user actions ────────────────────────────────────────────

describe("Users List — refresh after user actions", () => {
    it("deletion triggers a re-fetch of the user list", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({ users: TEST_USERS });
        renderAccordions();

        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => screen.getByText("alice@example.com"));
        expect(vi.mocked(adminGetUsersAction)).toHaveBeenCalledTimes(1);

        // Confirm deletion dialog for alice
        const deleteButtons = screen.getAllByRole("button", { name: "Удалить пользователя" });
        fireEvent.click(deleteButtons[0]);
        fireEvent.click(screen.getByRole("button", { name: "Удалить" }));

        await waitFor(() => {
            expect(vi.mocked(adminGetUsersAction)).toHaveBeenCalledTimes(2);
        });
    });

    it("role change triggers a re-fetch of the user list", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({ users: TEST_USERS });
        renderAccordions();

        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => screen.getByText("alice@example.com"));
        expect(vi.mocked(adminGetUsersAction)).toHaveBeenCalledTimes(1);

        // Click the promote button for alice
        fireEvent.click(screen.getByRole("button", { name: "Сделать администратором" }));
        fireEvent.click(screen.getByRole("button", { name: "Назначить" }));

        await waitFor(() => {
            expect(vi.mocked(adminGetUsersAction)).toHaveBeenCalledTimes(2);
        });
    });
});

// ─── Self-demotion guard ──────────────────────────────────────────────────

describe("Users List — self-protection", () => {
    it("self-demotion button is disabled for the current admin", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({ users: TEST_USERS });
        renderAccordions("admin-id");

        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => screen.getByText("admin@example.com"));

        // The admin's own demotion button is disabled
        const demoteBtn = screen.getByRole("button", { name: "Снять права администратора" });
        expect(demoteBtn).toBeDisabled();
    });

    it("self-delete button is disabled for the current user", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({ users: TEST_USERS });
        renderAccordions("admin-id");

        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => screen.getByText("admin@example.com"));

        const deleteButtons = screen.getAllByRole("button", { name: "Удалить пользователя" });
        // admin-id is second in the list — find the disabled one
        const disabledDelete = deleteButtons.find((btn) => btn.hasAttribute("disabled"));
        expect(disabledDelete).toBeInTheDocument();
    });
});

// ─── Confirmation dialogs ─────────────────────────────────────────────────

describe("Users List — existing confirmation dialogs", () => {
    it("delete action shows confirmation dialog", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({ users: TEST_USERS });
        renderAccordions();

        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => screen.getByText("alice@example.com"));

        const deleteButtons = screen.getAllByRole("button", { name: "Удалить пользователя" });
        fireEvent.click(deleteButtons[0]);
        expect(screen.getByText("Удалить пользователя?")).toBeInTheDocument();
    });

    it("role action shows confirmation dialog", async () => {
        vi.mocked(adminGetUsersAction).mockResolvedValue({ users: TEST_USERS });
        renderAccordions();

        fireEvent.click(screen.getByRole("button", { name: "Список пользователей" }));
        await waitFor(() => screen.getByText("alice@example.com"));

        fireEvent.click(screen.getByRole("button", { name: "Сделать администратором" }));
        expect(screen.getByText("Назначить администратором?")).toBeInTheDocument();
    });
});
