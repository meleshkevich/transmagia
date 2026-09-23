import "server-only";

import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminUser = {
    id: string;
    email: string | null;
    displayName: string | null;
    isAdmin: boolean;
    createdAt: string;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
    await requireAdmin();
    const supabase = createSupabaseAdminClient();

    const [profilesResult, usersResult] = await Promise.all([
        supabase.from("profiles").select("id, is_admin, display_name, created_at").order("created_at"),
        supabase.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    if (profilesResult.error) throw new Error("Не удалось получить профили пользователей.");
    if (usersResult.error) throw new Error("Не удалось получить список пользователей.");

    const emailMap = new Map(usersResult.data.users.map((u) => [u.id, u.email ?? null]));

    return (profilesResult.data ?? []).map((profile) => ({
        id: profile.id,
        email: emailMap.get(profile.id) ?? null,
        displayName: profile.display_name,
        isAdmin: profile.is_admin,
        createdAt: profile.created_at,
    }));
}

export type UserMutationResult = { message?: string };

export async function adminCreateUser(
    email: string,
    password: string,
    displayName: string | undefined,
): Promise<UserMutationResult> {
    try {
        await requireAdmin();

        if (!email.trim()) return { message: "Введите email." };
        if (!password.trim()) return { message: "Введите пароль." };
        if (password.length < 6) return { message: "Пароль должен содержать не менее 6 символов." };

        const supabase = createSupabaseAdminClient();
        const userMetadata: Record<string, string> = {};
        if (displayName?.trim()) {
            userMetadata.display_name = displayName.trim();
        }

        const { error } = await supabase.auth.admin.createUser({
            email: email.trim(),
            password,
            email_confirm: true,
            user_metadata: userMetadata,
        });

        if (error) {
            if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
                return { message: "Пользователь с таким email уже существует." };
            }
            return { message: "Не удалось создать пользователя." };
        }

        return {};
    } catch (error) {
        return { message: error instanceof Error ? error.message : "Не удалось создать пользователя." };
    }
}

export async function adminSetUserAdminRole(
    currentUserId: string,
    targetUserId: string,
    isAdmin: boolean,
): Promise<UserMutationResult> {
    try {
        await requireAdmin();

        if (!isAdmin && currentUserId === targetUserId) {
            return { message: "Нельзя снять права администратора у себя." };
        }

        const supabase = createSupabaseAdminClient();

        const { data: targetProfile, error: fetchError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", targetUserId)
            .maybeSingle();

        if (fetchError || !targetProfile) {
            return { message: "Пользователь не найден." };
        }

        const { error } = await supabase
            .from("profiles")
            .update({ is_admin: isAdmin })
            .eq("id", targetUserId);

        if (error) return { message: "Не удалось изменить права пользователя." };

        return {};
    } catch (error) {
        return { message: error instanceof Error ? error.message : "Не удалось изменить права пользователя." };
    }
}
