"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth/server";
import { canReadChapter } from "@/lib/auth/access";
import { markChapterRead, unmarkChapterRead } from "@/lib/reader/reading-progress";

export type ReadingProgressActionState = {
    success?: boolean;
    message?: string;
    /** The canonical new state after the action. */
    isRead?: boolean;
};

// Matches any UUID format (all versions) without restricting to a specific version.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: unknown): value is string {
    return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Marks a chapter as read for the currently authenticated user.
 *
 * Authorization flow:
 *  1. Resolve authenticated user from the server session (no client-supplied ID).
 *  2. Validate chapterId format before any database query.
 *  3. Verify the user can read the chapter (checks chapter status, book status,
 *     section access, and the translations password cookie).
 *  4. Write progress via the service-role client.
 *  5. Revalidate the book TOC and section catalog paths.
 */
export async function markChapterReadAction(
    chapterId: string,
    sectionSlug: string,
    bookSlug: string,
): Promise<ReadingProgressActionState> {
    try {
        const profile = await getCurrentProfile();
        if (!profile) {
            return { success: false, message: "Необходимо войти в аккаунт." };
        }

        if (!isValidUuid(chapterId)) {
            return { success: false, message: "Некорректный идентификатор главы." };
        }

        const accessible = await canReadChapter(chapterId);
        if (!accessible) {
            return { success: false, message: "Нет доступа к данной главе." };
        }

        await markChapterRead(profile.id, chapterId);

        revalidatePath(`/${sectionSlug}/${bookSlug}`);
        revalidatePath(`/${sectionSlug}`);

        return { success: true, isRead: true };
    } catch {
        return {
            success: false,
            message: "Не удалось сохранить прогресс чтения. Попробуйте ещё раз.",
        };
    }
}

/**
 * Unmarks a chapter as read for the currently authenticated user.
 *
 * Authorization flow:
 *  1. Resolve authenticated user from the server session.
 *  2. Validate chapterId format before any database query.
 *  3. Verify the user can read the chapter (ensures they have section access).
 *  4. Delete only this user's progress record via the service-role client.
 *  5. Revalidate the book TOC and section catalog paths.
 */
export async function unmarkChapterReadAction(
    chapterId: string,
    sectionSlug: string,
    bookSlug: string,
): Promise<ReadingProgressActionState> {
    try {
        const profile = await getCurrentProfile();
        if (!profile) {
            return { success: false, message: "Необходимо войти в аккаунт." };
        }

        if (!isValidUuid(chapterId)) {
            return { success: false, message: "Некорректный идентификатор главы." };
        }

        const accessible = await canReadChapter(chapterId);
        if (!accessible) {
            return { success: false, message: "Нет доступа к данной главе." };
        }

        await unmarkChapterRead(profile.id, chapterId);

        revalidatePath(`/${sectionSlug}/${bookSlug}`);
        revalidatePath(`/${sectionSlug}`);

        return { success: true, isRead: false };
    } catch {
        return {
            success: false,
            message: "Не удалось сохранить прогресс чтения. Попробуйте ещё раз.",
        };
    }
}
