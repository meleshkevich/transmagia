"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { updateMyDisplayNameAction } from "@/app/actions/profile";
import type { ProfileActionState } from "@/app/actions/profile";
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/profile/display-name-policy";

type ProfileFormProps = {
    email: string;
    initialDisplayName: string | null;
};

export function ProfileForm({ email, initialDisplayName }: ProfileFormProps) {
    const router = useRouter();
    const [state, formAction, pending] = useActionState<ProfileActionState | undefined, FormData>(
        updateMyDisplayNameAction,
        undefined,
    );

    useEffect(() => {
        if (state?.success) {
            router.refresh();
        }
    }, [state?.success, router]);

    return (
        <form action={formAction} className="space-y-6">
            <div className="space-y-2">
                <label htmlFor="profile-email" className="text-sm font-medium">
                    Моя почта
                </label>
                <input
                    id="profile-email"
                    type="email"
                    value={email}
                    readOnly
                    aria-readonly="true"
                    aria-label="Адрес электронной почты (только для чтения)"
                    className="h-11 w-full border border-border bg-muted px-3 text-muted-foreground outline-none cursor-default"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="display_name" className="text-sm font-medium">
                    Моё имя
                </label>
                <input
                    id="display_name"
                    name="display_name"
                    type="text"
                    defaultValue={initialDisplayName ?? ""}
                    placeholder="Читатель"
                    maxLength={MAX_DISPLAY_NAME_LENGTH}
                    autoComplete="name"
                    className="h-11 w-full border border-border bg-background px-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
            </div>

            {state?.message && (
                <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                    {state.message}
                </p>
            )}
            {state?.success && (
                <p role="status" className="border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
                    Имя успешно сохранено.
                </p>
            )}

            <button
                type="submit"
                disabled={pending}
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
                {pending ? "Сохранение..." : "Сохранить изменения"}
            </button>
        </form>
    );
}
