"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";

import { TiptapEditor } from "@/components/admin/tiptap-editor";
import type { AdminChapter } from "@/lib/admin/data";
import type { CmsActionState } from "@/app/actions/cms";

type ChapterFormProps = {
    bookId: string;
    chapter?: AdminChapter;
    initialContent: Record<string, unknown>;
    action: (state: CmsActionState | undefined, formData: FormData) => Promise<CmsActionState>;
    uploadImage: (formData: FormData) => Promise<{ path?: string; message?: string }>;
};

export function ChapterForm({ bookId, chapter, initialContent, action, uploadImage }: ChapterFormProps) {
    const [state, formAction, pending] = useActionState(action, undefined);
    const [content, setContent] = useState(initialContent);
    const [uploadMessage, setUploadMessage] = useState<string | undefined>();

    async function handleUpload(file: File): Promise<string | null> {
        const formData = new FormData();
        formData.set("image", file);
        const result = await uploadImage(formData);
        setUploadMessage(result.message);
        return result.path ?? null;
    }

    return (
        <form action={formAction} className="admin-form admin-chapter-form">
            {state?.message && <p className="admin-error" role="alert">{state.message}</p>}
            {uploadMessage && <p className="admin-error" role="alert">{uploadMessage}</p>}
            <input type="hidden" name="content" value={JSON.stringify(content)} readOnly />
            <label>Название<input name="title" required defaultValue={chapter?.title ?? ""} /></label>
            <div className="admin-editor-label">Содержимое</div>
            <TiptapEditor initialContent={initialContent} onChange={setContent} onUploadImage={handleUpload} />
            <div className="admin-form-grid">
                <label>Статус<select name="status" defaultValue={chapter?.status ?? "draft"}><option value="draft">Черновик</option><option value="published">Опубликована</option></select></label>
                <label>Порядок<input name="sortOrder" type="number" min="1" required defaultValue={chapter?.sortOrder ?? 1} /></label>
            </div>
            <div className="admin-form-actions">
                <Link href={`/admin/books/${bookId}`} className="admin-secondary-button">Отмена</Link>
                <button type="submit" name="publish" value="draft" disabled={pending} className="admin-secondary-button">{pending ? "Сохранение..." : "Сохранить черновик"}</button>
                <button type="submit" name="publish" value="published" disabled={pending} className="admin-primary-button">{pending ? "Сохранение..." : "Опубликовать"}</button>
            </div>
        </form>
    );
}
