"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Bold, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2 } from "lucide-react";

const emptyDocument = { type: "doc", content: [{ type: "paragraph" }] };

type EditorValue = Record<string, unknown>;

type TiptapEditorProps = {
    initialContent: EditorValue;
    onChange: (content: EditorValue) => void;
    onUploadImage: (file: File) => Promise<string | null>;
};

function ToolbarButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
    return (
        <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className="admin-editor-button">
            {children}
        </button>
    );
}

export function TiptapEditor({ initialContent, onChange, onUploadImage }: TiptapEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false, autolink: true }),
            Image.configure({ allowBase64: false }),
        ],
        content: initialContent ?? emptyDocument,
        editorProps: {
            attributes: { class: "admin-editor-content" },
        },
        onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getJSON() as EditorValue),
    });

    if (!editor) return <div className="admin-editor-loading">Загрузка редактора...</div>;

    async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        const path = await onUploadImage(file);
        if (path) {
            editor?.chain().focus().setImage({ src: `/api/content-images/${path}` }).run();
        }
    }

    return (
        <div className="admin-editor">
            <div className="admin-editor-toolbar" aria-label="Панель форматирования">
                <ToolbarButton label="Отменить" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 /></ToolbarButton>
                <ToolbarButton label="Повторить" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 /></ToolbarButton>
                <span className="admin-editor-divider" />
                <ToolbarButton label="Жирный" onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></ToolbarButton>
                <ToolbarButton label="Курсив" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></ToolbarButton>
                <ToolbarButton label="Цитата" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote /></ToolbarButton>
                <ToolbarButton label="Маркированный список" onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></ToolbarButton>
                <ToolbarButton label="Нумерованный список" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered /></ToolbarButton>
                <ToolbarButton label="Ссылка" onClick={() => {
                    const href = window.prompt("Введите ссылку");
                    if (href) editor.chain().focus().setLink({ href }).run();
                }}><Link2 /></ToolbarButton>
                <label className="admin-editor-button" title="Добавить изображение">
                    <ImagePlus />
                    <span className="sr-only">Добавить изображение</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} hidden />
                </label>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
