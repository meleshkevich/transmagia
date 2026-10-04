"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";

import { TiptapEditor } from "@/components/admin/tiptap-editor";
import type { AdminSection } from "@/lib/admin/data";
import type { CmsActionState } from "@/app/actions/cms";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

type BookFormProps = {
    sections: AdminSection[];
    action: (state: CmsActionState | undefined, formData: FormData) => Promise<CmsActionState>;
    submitLabel: string;
    book?: {
        title: string;
        author: string | null;
        description: Record<string, unknown> | null;
        sectionId: string;
        status: "draft" | "published";
        authorSortOrder?: number;
    };
    /** Expected next position shown on the create form (read-only). */
    nextAuthorSortOrder?: number;
};

export function BookForm({ sections, action, submitLabel, book, nextAuthorSortOrder }: BookFormProps) {
    const [state, formAction, pending] = useActionState(action, undefined);
    const [description, setDescription] = useState<Record<string, unknown>>(book?.description ?? EMPTY_DOC);

    return (
        <form action={formAction} encType="multipart/form-data" className="admin-form">
            {state?.message && <p className="admin-error" role="alert">{state.message}</p>}
            <label>Название<input name="title" required defaultValue={book?.title ?? ""} /></label>
            <label>Автор<input name="author" defaultValue={book?.author ?? ""} /></label>
            <input type="hidden" name="description" value={JSON.stringify(description)} readOnly />
            <div className="admin-editor-label">Описание</div>
            <TiptapEditor initialContent={book?.description ?? EMPTY_DOC} onChange={setDescription} />
            <label>Раздел<select name="sectionId" required defaultValue={book?.sectionId ?? sections[0]?.id ?? ""}>{sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select></label>
            <label>Обложка<input name="cover" type="file" accept="image/jpeg,image/png,image/webp" /></label>
            <label>Статус<select name="status" defaultValue={book?.status ?? "draft"}><option value="draft">Черновик</option><option value="published">Опубликована</option></select></label>
            {book?.authorSortOrder !== undefined ? (
                <label>
                    Порядок среди книг автора
                    <input
                        name="authorSortOrder"
                        type="number"
                        min={1}
                        defaultValue={book.authorSortOrder}
                    />
                    <span className="admin-field-hint">Изменение порядка автоматически сдвигает другие книги автора.</span>
                </label>
            ) : (
                <label>
                    Порядок среди книг автора
                    <input
                        name="authorSortOrder"
                        type="number"
                        min={1}
                        defaultValue={nextAuthorSortOrder ?? ""}
                        readOnly
                        disabled
                    />
                    <span className="admin-field-hint">Будет назначен автоматически.</span>
                </label>
            )}
            <div className="admin-form-actions">
                <Link href="/admin/books" className="admin-secondary-button">Отмена</Link>
                <button type="submit" disabled={pending} className="admin-primary-button">{pending ? "Сохранение..." : submitLabel}</button>
            </div>
        </form>
    );
}
