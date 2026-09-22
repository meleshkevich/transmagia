"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionState = {
    message?: string;
    fieldErrors?: {
        email?: string;
        password?: string;
        confirmPassword?: string;
    };
};

function readText(formData: FormData, name: string): string {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
}

function validateCredentials(email: string, password: string): AuthActionState | null {
    const fieldErrors: AuthActionState["fieldErrors"] = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        fieldErrors.email = "Введите корректный email.";
    }
    if (password.length < 8) {
        fieldErrors.password = "Пароль должен содержать не менее 8 символов.";
    }
    return Object.keys(fieldErrors).length > 0 ? { fieldErrors } : null;
}

export async function signIn(
    _previousState: AuthActionState | undefined,
    formData: FormData,
): Promise<AuthActionState> {
    const email = readText(formData, "email").toLowerCase();
    const password = readText(formData, "password");
    const validation = validateCredentials(email, password);
    if (validation) {
        return validation;
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return { message: "Неверный email или пароль." };
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signUp(
    _previousState: AuthActionState | undefined,
    formData: FormData,
): Promise<AuthActionState> {
    const email = readText(formData, "email").toLowerCase();
    const password = readText(formData, "password");
    const confirmPassword = readText(formData, "confirmPassword");
    const validation = validateCredentials(email, password);
    if (validation) {
        return validation;
    }
    if (password !== confirmPassword) {
        return { fieldErrors: { confirmPassword: "Пароли не совпадают." } };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
            return { message: "Пользователь с таким email уже зарегистрирован." };
        }
        return { message: "Не удалось зарегистрироваться. Попробуйте ещё раз." };
    }

    revalidatePath("/", "layout");
    if (!data.session) {
        redirect("/login?registered=1");
    }
    redirect("/");
}

export async function signOut(): Promise<void> {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/");
}
