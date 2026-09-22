"use client";

import { useActionState } from "react";

import { submitSectionPassword } from "@/app/actions/access";

type SectionPasswordFormProps = {
    sectionId: string;
    redirectTo: string;
};

export function SectionPasswordForm({ sectionId, redirectTo }: SectionPasswordFormProps) {
    const [state, action, pending] = useActionState(submitSectionPassword, undefined);

    return (
        <form action={action} className="space-y-4">
            <input type="hidden" name="sectionId" value={sectionId} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <div className="space-y-2">
                <label htmlFor="section-password" className="text-sm font-medium">Пароль раздела</label>
                <input
                    id="section-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="h-11 w-full border border-border bg-background px-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
            </div>
            {state?.message && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
            <button type="submit" disabled={pending} className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {pending ? "Проверка..." : "Открыть раздел"}
            </button>
        </form>
    );
}
