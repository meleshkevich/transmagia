"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { markChapterReadAction, unmarkChapterReadAction } from "@/app/actions/reading-progress";

type Props = {
    chapterId: string;
    initialIsRead: boolean;
    sectionSlug: string;
    bookSlug: string;
};

export function ChapterReadCheckbox({ chapterId, initialIsRead, sectionSlug, bookSlug }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // committedIsRead tracks the last confirmed-by-server state.
    // useOptimistic overlays the intended state during a pending transition.
    const [committedIsRead, setCommittedIsRead] = useState(initialIsRead);
    const [optimisticIsRead, setOptimisticIsRead] = useOptimistic(committedIsRead);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Sync committed state when the server re-renders with a new initialIsRead value
    // (e.g. after router.refresh()). Uses the getDerivedStateFromProps pattern to
    // avoid a useEffect-triggered extra render cycle.
    const [prevInitialIsRead, setPrevInitialIsRead] = useState(initialIsRead);
    if (initialIsRead !== prevInitialIsRead) {
        setPrevInitialIsRead(initialIsRead);
        setCommittedIsRead(initialIsRead);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const nextIsRead = e.target.checked;

        startTransition(async () => {
            setOptimisticIsRead(nextIsRead);

            const result = nextIsRead
                ? await markChapterReadAction(chapterId, sectionSlug, bookSlug)
                : await unmarkChapterReadAction(chapterId, sectionSlug, bookSlug);

            if (result.success) {
                setCommittedIsRead(nextIsRead);
                setErrorMessage(null);
                router.refresh();
            } else {
                setErrorMessage(
                    result.message ?? "Не удалось сохранить прогресс чтения. Попробуйте ещё раз.",
                );
                // optimisticIsRead reverts to committedIsRead automatically on transition end
            }
        });
    }

    return (
        <div className="chapter-read-checkbox-wrapper">
            <label className="chapter-read-checkbox-label">
                <input
                    type="checkbox"
                    className="chapter-read-checkbox"
                    checked={optimisticIsRead}
                    onChange={handleChange}
                    disabled={isPending}
                    aria-label="Прочитано"
                />
                <span>Прочитано</span>
            </label>
            {errorMessage && (
                <p className="chapter-read-checkbox-error" role="alert">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}
