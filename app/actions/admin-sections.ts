"use server";

import { revalidatePath } from "next/cache";
import { setSectionPassword } from "@/lib/auth/access";

export type SectionPasswordActionState = {
    message?: string;
    success?: boolean;
};

export async function setSectionPasswordAction(
    _previous: SectionPasswordActionState | undefined,
    formData: FormData,
): Promise<SectionPasswordActionState> {
    const sectionId = String(formData.get("sectionId") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    if (!sectionId) return { message: "Раздел не указан." };
    if (!password) return { message: "Введите пароль." };
    if (password.length < 6) return { message: "Пароль должен содержать не менее 6 символов." };

    try {
        await setSectionPassword(sectionId, password);
        revalidatePath("/admin/sections");
        return { success: true, message: "Пароль успешно сохранён." };
    } catch (err) {
        return { message: err instanceof Error ? err.message : "Не удалось сохранить пароль." };
    }
}

export async function removeSectionPasswordAction(
    _previous: SectionPasswordActionState | undefined,
    formData: FormData,
): Promise<SectionPasswordActionState> {
    const sectionId = String(formData.get("sectionId") ?? "").trim();

    if (!sectionId) return { message: "Раздел не указан." };

    try {
        await setSectionPassword(sectionId, null);
        revalidatePath("/admin/sections");
        return { success: true, message: "Пароль успешно удалён." };
    } catch (err) {
        return { message: err instanceof Error ? err.message : "Не удалось удалить пароль." };
    }
}
