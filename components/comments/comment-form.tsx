"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { submitCommentAction } from "@/app/actions/comments";

export function CommentForm({ chapterId }: { chapterId: string }) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [state, action, pending] = useActionState(submitCommentAction, undefined);

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
            router.refresh();
        }
    }, [state?.success, router]);

    return (
        <form ref={formRef} action={action} className="comment-form">
            <input type="hidden" name="chapterId" value={chapterId} />
            <label className="comment-form-label">
                <span>Ваш комментарий</span>
                <textarea
                    name="content"
                    className="comment-form-textarea"
                    placeholder="Поделитесь впечатлениями…"
                    rows={4}
                    required
                    maxLength={5000}
                    disabled={pending}
                />
            </label>
            {state?.message && (
                <p className="comment-form-error" role="alert">{state.message}</p>
            )}
            {state?.success && (
                <p className="comment-form-success" role="status">Комментарий отправлен.</p>
            )}
            <div className="comment-form-actions">
                <button type="submit" className="comment-submit" disabled={pending}>
                    {pending ? "Отправка…" : "Отправить"}
                </button>
            </div>
        </form>
    );
}
