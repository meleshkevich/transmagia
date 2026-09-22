"use server";

import { redirect } from "next/navigation";

import { verifyAndGrantSectionAccess } from "@/lib/auth/access";

type AccessActionState = {
    message?: string;
};

export async function submitSectionPassword(
    _previousState: AccessActionState | undefined,
    formData: FormData,
): Promise<AccessActionState> {
    const sectionId = formData.get("sectionId");
    const password = formData.get("password");
    const redirectTo = formData.get("redirectTo");

    if (typeof sectionId !== "string" || typeof password !== "string" || !password) {
        return { message: "Введите пароль." };
    }

    const granted = await verifyAndGrantSectionAccess(sectionId, password);
    if (!granted) {
        return { message: "Неверный пароль." };
    }

    const destination =
        typeof redirectTo === "string" && redirectTo.startsWith("/")
            ? redirectTo
            : "/";
    redirect(destination);
}
