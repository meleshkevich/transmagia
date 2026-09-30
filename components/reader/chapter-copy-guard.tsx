"use client";

// Copy events and common clipboard shortcuts are suppressed inside this element as a UX
// deterrent — not DRM. Content delivered to the browser cannot be made technically
// impossible to extract.

import { useEffect, useRef, type ReactNode } from "react";
import { isInsideProtected, isSelectionInsideProtected, shouldBlockKey } from "@/lib/reader/copy-guard";

export function ChapterCopyGuard({ children }: { children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const prevent = (e: Event) => e.preventDefault();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            if (!shouldBlockKey(e.key)) return;
            if (
                isInsideProtected(e.target, el) ||
                isSelectionInsideProtected(window.getSelection(), el)
            ) {
                e.preventDefault();
            }
        };

        el.addEventListener("copy", prevent);
        el.addEventListener("cut", prevent);
        el.addEventListener("contextmenu", prevent);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            el.removeEventListener("copy", prevent);
            el.removeEventListener("cut", prevent);
            el.removeEventListener("contextmenu", prevent);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <div ref={ref} className="chapter-copy-guard">
            {children}
        </div>
    );
}
