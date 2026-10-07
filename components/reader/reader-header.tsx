import type { ReactNode } from "react";
import Link from "next/link";

interface ReaderHeaderProps {
    sectionName?: string;
    bookTitle?: string;
    searchSlot?: ReactNode;
}

export function ReaderHeader({ sectionName, bookTitle, searchSlot }: ReaderHeaderProps) {
    return (
        <header className="border-b border-border/70 bg-background/95">
            <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4 lg:px-8">
                <Link href="/" className="shrink-0 font-reader text-lg font-semibold">Трансмагия</Link>
                <div className="ml-auto flex items-center gap-3">
                    {searchSlot}
                    <div className="min-w-0 text-right text-sm text-muted-foreground">
                        {sectionName && <span className="hidden sm:inline">{sectionName}</span>}
                        {bookTitle && <span className="block truncate font-semibold text-foreground">{bookTitle}</span>}
                    </div>
                </div>
            </div>
        </header>
    );
}
