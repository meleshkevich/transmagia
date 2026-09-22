"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AdminSection } from "@/lib/admin/data";
import type { CmsActionState } from "@/app/actions/cms";

type BookFormProps = {
    sections: AdminSection[];
    action: (state: CmsActionState | undefined, formData: FormData) => Promise<CmsActionState>;
    submitLabel: string;
    book?: {
        title: string;
        author: string | null;
        description: string | null;
        sectionId: string;
        status: "draft" | "published";
    };
};

export function BookForm({ sections, action, submitLabel, book }: BookFormProps) {
    const [state, formAction, pending] = useActionState(action, undefined);
    return (
        <form action={formAction} encType="multipart/form-data" className="admin-form">
            {state?.message && <p className="admin-error" role="alert">{state.message}</p>}
            <label>Название<input name="title" required defaultValue={book?.title ?? ""} /></label>
            <label>Автор<input name="author" defaultValue={book?.author ?? ""} /></label>
            <label>Описание<textarea name="description" rows={5} defaultValue={book?.description ?? ""} /></label>
            <label>Раздел<select name="sectionId" required defaultValue={book?.sectionId ?? sections[0]?.id ?? ""}>{sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select></label>
            <label>Обложка<input name="cover" type="file" accept="image/jpeg,image/png,image/webp" /></label>
            <label>Статус<select name="status" defaultValue={book?.status ?? "draft"}><option value="draft">Черновик</option><option value="published">Опубликована</option></select></label>
            <div className="admin-form-actions">
                <Link href="/admin/books" className="admin-secondary-button">Отмена</Link>
                <button type="submit" disabled={pending} className="admin-primary-button">{pending ? "Сохранение..." : submitLabel}</button>
            </div>
        </form>
    );
}
