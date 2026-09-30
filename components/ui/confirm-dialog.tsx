"use client";

import { useId, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { DialogBase } from "@/components/ui/dialog";

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    loading?: boolean;
    errorMessage?: string;
}

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Подтвердить",
    cancelLabel = "Отмена",
    destructive = false,
    loading = false,
    errorMessage,
}: ConfirmDialogProps) {
    const titleId = useId();
    const descId = useId();

    return (
        <DialogBase
            open={open}
            onClose={onClose}
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
        >
            <div className="app-dialog-inner">
                <p id={titleId} className="app-dialog-title">{title}</p>
                {description && (
                    <p id={descId} className="app-dialog-description">{description}</p>
                )}
                {errorMessage && (
                    <p role="alert" className="app-dialog-error">{errorMessage}</p>
                )}
                <div className="app-dialog-actions">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={destructive ? "destructive" : "default"}
                        size="sm"
                        onClick={onConfirm}
                        disabled={loading}
                        aria-busy={loading}
                    >
                        {loading ? "…" : confirmLabel}
                    </Button>
                </div>
            </div>
        </DialogBase>
    );
}
