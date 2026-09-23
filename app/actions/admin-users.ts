"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/server";
import { adminCreateUser, adminSetUserAdminRole } from "@/lib/admin/users";

export type UserActionState = { message?: string; success?: boolean };

export async function adminCreateUserAction(
    _previous: UserActionState | undefined,
    formData: FormData,
): Promise<UserActionState> {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const displayName = String(formData.get("displayName") ?? "").trim() || undefined;

    if (password !== confirmPassword) {
        return { message: "Пароли не совпадают." };
    }

    const result = await adminCreateUser(email, password, displayName);
    if (!result.message) {
        revalidatePath("/admin/users");
        return { success: true };
    }
    return result;
}

export async function adminPromoteUserAction(targetUserId: string): Promise<UserActionState> {
    const user = await getCurrentUser();
    if (!user) return { message: "Нет доступа." };

    const result = await adminSetUserAdminRole(user.id, targetUserId, true);
    if (!result.message) {
        revalidatePath("/admin/users");
        return { success: true };
    }
    return result;
}

export async function adminDemoteUserAction(targetUserId: string): Promise<UserActionState> {
    const user = await getCurrentUser();
    if (!user) return { message: "Нет доступа." };

    const result = await adminSetUserAdminRole(user.id, targetUserId, false);
    if (!result.message) {
        revalidatePath("/admin/users");
        return { success: true };
    }
    return result;
}
