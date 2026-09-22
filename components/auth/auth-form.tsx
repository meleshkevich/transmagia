"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthActionState } from "@/app/actions/auth";

type AuthAction = (
    state: AuthActionState | undefined,
    formData: FormData,
) => Promise<AuthActionState>;

type AuthFormProps = {
    mode: "login" | "register";
    action: AuthAction;
    registered?: boolean;
};

export function AuthForm({ mode, action, registered = false }: AuthFormProps) {
    const [state, formAction, pending] = useActionState(action, undefined);
    const isRegistration = mode === "register";

    return (
        <form action={formAction} className="space-y-5" noValidate>
            {registered && (
                <p className="border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
                    Регистрация завершена. Проверьте почту для подтверждения адреса.
                </p>
            )}
            {state?.message && (
                <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                    {state.message}
                </p>
            )}
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="h-11 w-full border border-border bg-background px-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
                {state?.fieldErrors?.email && <p className="text-sm text-destructive">{state.fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Пароль</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isRegistration ? "new-password" : "current-password"}
                    required
                    className="h-11 w-full border border-border bg-background px-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
                {state?.fieldErrors?.password && <p className="text-sm text-destructive">{state.fieldErrors.password}</p>}
            </div>
            {isRegistration && (
                <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">Подтверждение пароля</label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="h-11 w-full border border-border bg-background px-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {state?.fieldErrors?.confirmPassword && <p className="text-sm text-destructive">{state.fieldErrors.confirmPassword}</p>}
                </div>
            )}
            <button
                type="submit"
                disabled={pending}
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
                {pending ? "Подождите..." : isRegistration ? "Зарегистрироваться" : "Войти"}
            </button>
            <p className="text-center text-sm text-muted-foreground">
                {isRegistration ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
                <Link className="font-semibold text-foreground underline underline-offset-4" href={isRegistration ? "/login" : "/register"}>
                    {isRegistration ? "Войти" : "Зарегистрироваться"}
                </Link>
            </p>
        </form>
    );
}
