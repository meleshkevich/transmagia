// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChapterReadCheckbox } from "./chapter-read-checkbox";

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/app/actions/reading-progress", () => ({
    markChapterReadAction: vi.fn(),
    unmarkChapterReadAction: vi.fn(),
}));

// Import after mocks are declared so vi.mocked resolves correctly.
import { markChapterReadAction, unmarkChapterReadAction } from "@/app/actions/reading-progress";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHAPTER_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const SECTION = "translations";
const BOOK = "my-book";

function renderCheckbox(initialIsRead: boolean) {
    render(
        <ChapterReadCheckbox
            chapterId={CHAPTER_ID}
            initialIsRead={initialIsRead}
            sectionSlug={SECTION}
            bookSlug={BOOK}
        />,
    );
    return screen.getByRole("checkbox");
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.resetAllMocks();
});

afterEach(() => {
    cleanup();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ChapterReadCheckbox", () => {
    // 1. Initially unread chapter displays unchecked.
    it("1. initially unread chapter displays unchecked", () => {
        const checkbox = renderCheckbox(false);
        expect(checkbox).not.toBeChecked();
    });

    // 2. Initially read chapter displays checked.
    it("2. initially read chapter displays checked", () => {
        const checkbox = renderCheckbox(true);
        expect(checkbox).toBeChecked();
    });

    // 3. Clicking unchecked immediately updates UI (optimistic).
    it("3. clicking unchecked immediately updates UI optimistically", async () => {
        vi.mocked(markChapterReadAction).mockResolvedValue({ success: true, isRead: true });
        const checkbox = renderCheckbox(false);

        fireEvent.click(checkbox);

        // Optimistic update is synchronous within the transition
        await waitFor(() => expect(checkbox).toBeChecked());
    });

    // 4. Successful mark remains checked after action resolves.
    it("4. successful mark remains checked after action resolves", async () => {
        vi.mocked(markChapterReadAction).mockResolvedValue({ success: true, isRead: true });
        const checkbox = renderCheckbox(false);

        fireEvent.click(checkbox);
        await waitFor(() => expect(markChapterReadAction).toHaveBeenCalledOnce());
        await waitFor(() => expect(checkbox).toBeChecked());
    });

    // 5. Successful unmark remains unchecked after action resolves.
    it("5. successful unmark remains unchecked after action resolves", async () => {
        vi.mocked(unmarkChapterReadAction).mockResolvedValue({ success: true, isRead: false });
        const checkbox = renderCheckbox(true);

        fireEvent.click(checkbox);
        await waitFor(() => expect(unmarkChapterReadAction).toHaveBeenCalledOnce());
        await waitFor(() => expect(checkbox).not.toBeChecked());
    });

    // 6. Failed mark restores unchecked state.
    it("6. failed mark restores unchecked state", async () => {
        vi.mocked(markChapterReadAction).mockResolvedValue({
            success: false,
            message: "Нет доступа к данной главе.",
        });
        const checkbox = renderCheckbox(false);

        fireEvent.click(checkbox);
        await waitFor(() => expect(markChapterReadAction).toHaveBeenCalledOnce());
        await waitFor(() => expect(checkbox).not.toBeChecked());
    });

    // 7. Failed unmark restores checked state.
    it("7. failed unmark restores checked state", async () => {
        vi.mocked(unmarkChapterReadAction).mockResolvedValue({
            success: false,
            message: "Нет доступа к данной главе.",
        });
        const checkbox = renderCheckbox(true);

        fireEvent.click(checkbox);
        await waitFor(() => expect(unmarkChapterReadAction).toHaveBeenCalledOnce());
        await waitFor(() => expect(checkbox).toBeChecked());
    });

    // 8. Failed action displays a persistent error message.
    it("8. failed action displays persistent error message", async () => {
        vi.mocked(markChapterReadAction).mockResolvedValue({
            success: false,
            message: "Не удалось сохранить прогресс чтения. Попробуйте ещё раз.",
        });
        const checkbox = renderCheckbox(false);

        fireEvent.click(checkbox);
        await waitFor(() =>
            expect(screen.getByRole("alert")).toHaveTextContent(
                "Не удалось сохранить прогресс чтения. Попробуйте ещё раз.",
            ),
        );
    });

    // 8b. Error message remains visible (does not disappear on its own).
    it("8b. error message remains visible after transition ends", async () => {
        vi.mocked(markChapterReadAction).mockResolvedValue({
            success: false,
            message: "Ошибка",
        });
        renderCheckbox(false);
        fireEvent.click(screen.getByRole("checkbox"));

        await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
        // Give React time to flush any pending re-renders and verify the error persists
        await new Promise((r) => setTimeout(r, 50));
        expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    // 9. Rapid repeated clicks do not create conflicting writes.
    // The disabled attribute prevents real browser clicks during a pending transition.
    // Note: fireEvent.click bypasses the disabled attribute in jsdom (unlike real browsers),
    // so we verify the disabled state itself — the mechanism that prevents duplicate clicks.
    it("9. checkbox is disabled while pending — prevents duplicate submissions", async () => {
        let resolve!: (v: { success: boolean; isRead: boolean }) => void;
        const deferred = new Promise<{ success: boolean; isRead: boolean }>((r) => {
            resolve = r;
        });
        vi.mocked(markChapterReadAction).mockReturnValue(deferred);

        const checkbox = renderCheckbox(false);
        fireEvent.click(checkbox);

        // Checkbox must be disabled while the transition is pending.
        // In a real browser this prevents the user from submitting a concurrent request.
        await waitFor(() => expect(checkbox).toBeDisabled());
        expect(markChapterReadAction).toHaveBeenCalledOnce();

        // Complete the action and verify the checkbox re-enables.
        resolve({ success: true, isRead: true });
        await waitFor(() => expect(checkbox).not.toBeDisabled());
        // Still only one call was made
        expect(markChapterReadAction).toHaveBeenCalledOnce();
    });

    // 10. Server refresh does not incorrectly reset committed state.
    it("10. router.refresh is called after successful mark", async () => {
        vi.mocked(markChapterReadAction).mockResolvedValue({ success: true, isRead: true });
        renderCheckbox(false);

        fireEvent.click(screen.getByRole("checkbox"));
        await waitFor(() => expect(mockRefresh).toHaveBeenCalledOnce());
    });

    it("10b. router.refresh is NOT called after failed mark", async () => {
        vi.mocked(markChapterReadAction).mockResolvedValue({
            success: false,
            message: "Ошибка",
        });
        renderCheckbox(false);

        fireEvent.click(screen.getByRole("checkbox"));
        await waitFor(() => expect(markChapterReadAction).toHaveBeenCalledOnce());
        expect(mockRefresh).not.toHaveBeenCalled();
    });

    // 11. Checkbox is keyboard accessible.
    it("11. checkbox has an accessible label", () => {
        renderCheckbox(false);
        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toHaveAccessibleName("Прочитано");
    });

    // 12. Pending state prevents duplicate submissions (covered by test 9 above,
    //     this variant confirms via aria-label semantics).
    it("12. pending state disables the checkbox input", async () => {
        let resolve!: (v: { success: boolean; isRead: boolean }) => void;
        const deferred = new Promise<{ success: boolean; isRead: boolean }>((r) => {
            resolve = r;
        });
        vi.mocked(markChapterReadAction).mockReturnValue(deferred);

        const checkbox = renderCheckbox(false);
        fireEvent.click(checkbox);

        await waitFor(() => expect(checkbox).toBeDisabled());
        resolve({ success: true, isRead: true });
        await waitFor(() => expect(checkbox).not.toBeDisabled());
    });

    // Action receives correct chapterId, sectionSlug, bookSlug.
    it("calls markChapterReadAction with chapterId, sectionSlug, bookSlug", async () => {
        vi.mocked(markChapterReadAction).mockResolvedValue({ success: true, isRead: true });
        renderCheckbox(false);

        fireEvent.click(screen.getByRole("checkbox"));
        await waitFor(() =>
            expect(markChapterReadAction).toHaveBeenCalledWith(CHAPTER_ID, SECTION, BOOK),
        );
    });

    it("calls unmarkChapterReadAction with chapterId, sectionSlug, bookSlug", async () => {
        vi.mocked(unmarkChapterReadAction).mockResolvedValue({ success: true, isRead: false });
        renderCheckbox(true);

        fireEvent.click(screen.getByRole("checkbox"));
        await waitFor(() =>
            expect(unmarkChapterReadAction).toHaveBeenCalledWith(CHAPTER_ID, SECTION, BOOK),
        );
    });
});
