import Link from "next/link";

export function ReaderHeader({ sectionName, bookTitle }: { sectionName?: string; bookTitle?: string }) {
    return (
        <header className="border-b border-border/70 bg-background/95">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
                <Link href="/" className="font-reader text-lg font-semibold">Трансмагия</Link>
                <div className="min-w-0 text-right text-sm text-muted-foreground">
                    {sectionName && <span className="hidden sm:inline">{sectionName}</span>}
                    {bookTitle && <span className="block truncate font-semibold text-foreground">{bookTitle}</span>}
                </div>
            </div>
        </header>
    );
}
