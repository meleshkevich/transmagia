"use client";

import { useActionState, useEffect, useRef } from "react";

import { adminCreateUserAction } from "@/app/actions/admin-users";

export function CreateUserForm({ onSuccess }: { onSuccess?: () => void }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, action, pending] = useActionState(adminCreateUserAction, undefined);

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
            onSuccess?.();
        }
    }, [state?.success, onSuccess]);

    return (
        <form ref={formRef} action={action} className="admin-form">
            <label>
                Email
                <input type="email" name="email" required autoComplete="off" />
            </label>
            <label>
                Имя (необязательно)
                <input type="text" name="displayName" autoComplete="off" />
            </label>
            <label>
                Пароль
                <input type="password" name="password" required minLength={6} autoComplete="new-password" />
            </label>
            <label>
                Подтверждение пароля
                <input type="password" name="confirmPassword" required minLength={6} autoComplete="new-password" />
            </label>
            {state?.message && (
                <p className="admin-error" role="alert">{state.message}</p>
            )}
            {state?.success && (
                <p className="admin-success" role="status">Пользователь создан.</p>
            )}
            <div className="admin-form-actions">
                <button type="submit" className="admin-primary-button" disabled={pending}>
                    {pending ? "Создание…" : "Создать пользователя"}
                </button>
            </div>
        </form>
    );
}
