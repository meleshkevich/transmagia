"use client";

import { useActionState } from "react";

import { removeSectionPasswordAction, setSectionPasswordAction } from "@/app/actions/admin-sections";

type Props = {
    sectionId: string;
    isProtected: boolean;
};

export function SectionPasswordManageForm({ sectionId, isProtected }: Props) {
    const [setPasswordState, setPasswordAction, setPasswordPending] = useActionState(setSectionPasswordAction, undefined);
    const [removePasswordState, removePasswordAction, removePasswordPending] = useActionState(removeSectionPasswordAction, undefined);

    return (
        <div className="space-y-6">
            <form action={setPasswordAction} className="space-y-4">
                <input type="hidden" name="sectionId" value={sectionId} />
                <div className="space-y-2">
                    <label htmlFor={`password-${sectionId}`} className="text-sm font-medium">
                        {isProtected ? "Новый пароль" : "Установить пароль"}
                    </label>
                    <input
                        id={`password-${sectionId}`}
                        type="password"
                        name="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="h-11 w-full border border-border bg-background px-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
                {setPasswordState?.message && (
                    <p role="alert" className={`text-sm ${setPasswordState.success ? "text-green-700 dark:text-green-500" : "text-destructive"}`}>
                        {setPasswordState.message}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={setPasswordPending}
                    className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                    {setPasswordPending ? "Сохранение..." : isProtected ? "Изменить пароль" : "Установить пароль"}
                </button>
            </form>

            {isProtected && (
                <form action={removePasswordAction}>
                    <input type="hidden" name="sectionId" value={sectionId} />
                    {removePasswordState?.message && (
                        <p role="alert" className={`mb-2 text-sm ${removePasswordState.success ? "text-green-700 dark:text-green-500" : "text-destructive"}`}>
                            {removePasswordState.message}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={removePasswordPending}
                        className="h-11 rounded-md border border-destructive bg-background px-4 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"
                    >
                        {removePasswordPending ? "Удаление..." : "Удалить пароль"}
                    </button>
                </form>
            )}
        </div>
    );
}
