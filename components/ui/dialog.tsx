"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface DialogBaseProps {
    open: boolean;
    onClose: () => void;
    "aria-labelledby": string;
    "aria-describedby"?: string;
    children: ReactNode;
}

/**
 * Base modal dialog using the native <dialog> element via showModal().
 * Provides: top-layer rendering, focus trap, focus restoration, Escape key
 * handling, and ::backdrop — all browser-native with no extra libraries.
 */
export function DialogBase({
    open,
    onClose,
    children,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
}: DialogBaseProps) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (open && !el.open) {
            el.showModal();
        } else if (!open && el.open) {
            el.close();
        }
    }, [open]);

    return (
        <dialog
            ref={ref}
            className="app-dialog"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            onCancel={(e) => {
                // Prevent native close — let React manage state
                e.preventDefault();
                onClose();
            }}
        >
            {children}
        </dialog>
    );
}
