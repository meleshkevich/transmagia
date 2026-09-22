"use server";

import {
    createBook,
    createChapter,
    updateBook,
    updateChapter,
    uploadContentImage,
} from "@/lib/admin/mutations";

export type CmsActionState = { message?: string };

export async function createBookAction(
    _previous: CmsActionState | undefined,
    formData: FormData,
): Promise<CmsActionState> {
    return createBook(formData);
}

export async function updateBookAction(
    bookId: string,
    _previous: CmsActionState | undefined,
    formData: FormData,
): Promise<CmsActionState> {
    return updateBook(bookId, formData);
}

export async function createChapterAction(
    bookId: string,
    _previous: CmsActionState | undefined,
    formData: FormData,
): Promise<CmsActionState> {
    return createChapter(bookId, formData);
}

export async function updateChapterAction(
    chapterId: string,
    _previous: CmsActionState | undefined,
    formData: FormData,
): Promise<CmsActionState> {
    return updateChapter(chapterId, formData);
}

export async function uploadContentImageAction(bookId: string, formData: FormData) {
    return uploadContentImage(bookId, formData);
}
