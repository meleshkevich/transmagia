"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { DialogBase } from "@/components/ui/dialog";

interface PromptDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    label: string;
    placeholder?: string;
    initialValue?: string;
    confirmLabel?: string;
}

/**
 * Modal with a text input field. The parent should pass a changing `key` prop
 * each time the dialog opens to guarantee a fresh state (React's standard
 * "reset on key change" pattern — no setState-in-effect needed).
 */
export function PromptDialog({
    open,
    onClose,
    onConfirm,
    title,
    label,
    placeholder,
    initialValue = "",
    confirmLabel = "Вставить",
}: PromptDialogProps) {
    const titleId = useId();
    const inputId = useId();
    const [value, setValue] = useState(initialValue);
    const [error, setError] = useState<string>();
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus and select on mount — parent supplies a new `key` on each open,
    // so this effect runs exactly once per dialog session.
    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 50);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) {
            setError("Введите ссылку.");
            return;
        }
        onConfirm(trimmed);
        onClose();
    }

    return (
        <DialogBase open={open} onClose={onClose} aria-labelledby={titleId}>
            <form className="app-dialog-inner" onSubmit={handleSubmit} noValidate>
                <p id={titleId} className="app-dialog-title">{title}</p>
                <div className="app-dialog-input-group">
                    <label htmlFor={inputId} className="app-dialog-input-label">
                        {label}
                    </label>
                    <input
                        ref={inputRef}
                        id={inputId}
                        type="url"
                        className="app-dialog-input"
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            setError(undefined);
                        }}
                        placeholder={placeholder ?? "https://"}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `${inputId}-err` : undefined}
                    />
                    {error && (
                        <p id={`${inputId}-err`} role="alert" className="app-dialog-error">
                            {error}
                        </p>
                    )}
                </div>
                <div className="app-dialog-actions">
                    <Button type="button" variant="outline" size="sm" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button type="submit" size="sm">
                        {confirmLabel}
                    </Button>
                </div>
            </form>
        </DialogBase>
    );
}
