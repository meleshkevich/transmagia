"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateDisplayName } from "@/lib/profile/display-name-policy";

export type ProfileActionState = {
    message?: string;
    success?: boolean;
};

export async function updateMyDisplayNameAction(
    _previous: ProfileActionState | undefined,
    formData: FormData,
): Promise<ProfileActionState> {
    const profile = await getCurrentProfile();
    if (!profile) {
        return { message: "Необходимо войти." };
    }

    const rawValue = formData.get("display_name");
    const rawString = typeof rawValue === "string" ? rawValue : "";

    const validation = validateDisplayName(rawString);
    if (!validation.valid) {
        return { message: validation.error };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("profiles")
        .update({ display_name: validation.normalizedValue })
        .eq("id", profile.id);

    if (error) {
        return { message: "Не удалось сохранить имя. Попробуйте ещё раз." };
    }

    revalidatePath("/profile");
    return { success: true };
}
