"use client";

import { useState } from "react";

import { reorderChaptersAction } from "@/app/actions/reorder";
import type { AdminChapter } from "@/lib/admin/data";

export function ChapterReorder({ bookId, chapters }: { bookId: string; chapters: AdminChapter[] }) {
    const [items, setItems] = useState(chapters);
    const [message, setMessage] = useState<string>();
    const [pending, setPending] = useState(false);

    function move(index: number, direction: -1 | 1) {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= items.length) return;
        const next = [...items];
        [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
        setItems(next.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex + 1 })));
    }

    async function save() {
        setPending(true);
        const result = await reorderChaptersAction(bookId, items.map((item) => item.id));
        setMessage(result.message ?? "Порядок сохранён.");
        setPending(false);
    }

    return (
        <div>
            <ol className="admin-chapter-list">
                {items.map((chapter, index) => <li key={chapter.id}>
                    <span className="admin-chapter-order">{String(index + 1).padStart(2, "0")}</span>
                    <div><span className="admin-table-title">{chapter.title}</span><span className={`admin-status admin-status-${chapter.status}`}>{chapter.status === "published" ? "Опубликована" : "Черновик"}</span></div>
                    <div className="admin-reorder-actions"><button type="button" aria-label={`Переместить «${chapter.title}» вверх`} disabled={index === 0 || pending} onClick={() => move(index, -1)}>↑</button><button type="button" aria-label={`Переместить «${chapter.title}» вниз`} disabled={index === items.length - 1 || pending} onClick={() => move(index, 1)}>↓</button></div>
                </li>)}
            </ol>
            <div className="admin-form-actions"><span className="admin-muted" role="status">{message}</span><button type="button" disabled={pending} onClick={save} className="admin-primary-button">{pending ? "Сохранение..." : "Сохранить порядок"}</button></div>
        </div>
    );
}
