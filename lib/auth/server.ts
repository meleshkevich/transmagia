import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type Profile = {
    id: string;
    is_admin: boolean;
    display_name: string | null;
};

function hasSupabaseEnvironment(): boolean {
    return Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
}

export async function getCurrentUser(): Promise<User | null> {
    if (!hasSupabaseEnvironment()) {
        return null;
    }

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
    if (!hasSupabaseEnvironment()) {
        return null;
    }

    const user = await getCurrentUser();
    if (!user) {
        return null;
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("id, is_admin, display_name")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        throw new Error("Не удалось получить профиль пользователя.");
    }

    return data;
}

export async function requireAuthenticatedUser(): Promise<User> {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login?next=/");
    }
    return user;
}

export async function requireAdmin(): Promise<{ user: User; profile: Profile }> {
    const user = await requireAuthenticatedUser();
    const profile = await getCurrentProfile();

    if (!profile?.is_admin) {
        redirect("/?error=Доступ+запрещён");
    }

    return { user, profile };
}

export async function isRegisteredReader(): Promise<boolean> {
    const profile = await getCurrentProfile();
    return Boolean(profile && !profile.is_admin);
}
