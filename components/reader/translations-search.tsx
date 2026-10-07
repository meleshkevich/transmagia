"use client";

import { useRouter } from "next/navigation";

interface TranslationsSearchProps {
    sectionSlug: string;
    currentQuery: string;
}

export function TranslationsSearch({ sectionSlug, currentQuery }: TranslationsSearchProps) {
    const router = useRouter();

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const q = ((data.get("q") as string) ?? "").trim();
        router.push(q ? `/${sectionSlug}?q=${encodeURIComponent(q)}` : `/${sectionSlug}`);
    }

    function handleClear() {
        router.push(`/${sectionSlug}`);
    }

    return (
        <form onSubmit={handleSubmit} role="search" aria-label="Поиск по каталогу переводов">
            <label htmlFor="translations-search" className="sr-only">
                Поиск по названию или автору
            </label>
            <div className="flex items-center gap-2">
                <input
                    id="translations-search"
                    type="search"
                    name="q"
                    defaultValue={currentQuery}
                    placeholder="Поиск..."
                    autoComplete="off"
                    className="h-8 w-60 border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {currentQuery && (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="Очистить поиск"
                        className="shrink-0 border border-border bg-background px-2 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        ✕
                    </button>
                )}
            </div>
        </form>
    );
}
