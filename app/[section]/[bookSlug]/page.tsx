import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check } from "lucide-react";

import { ReaderHeader } from "@/components/reader/reader-header";
import { SectionGate } from "@/components/reader/section-gate";
import { TiptapRenderer } from "@/components/reader/tiptap-renderer";
import { getCurrentProfile } from "@/lib/auth/server";
import { canReadSection } from "@/lib/auth/access";
import { getPublishedBook, getPublishedChapters } from "@/lib/reader/data";
import { getReadChapterIdsForBook } from "@/lib/reader/reading-progress";
import { extractTiptapText } from "@/lib/tiptap-text";
import { decodeParam } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ section: string; bookSlug: string }> }): Promise<Metadata> {
    const { section, bookSlug } = await params;
    const result = await getPublishedBook(decodeParam(section), decodeParam(bookSlug));
    if (!result) return {};
    const plainDescription = result.book.description ? extractTiptapText(result.book.description) : null;
    return {
        title: result.book.title,
        description: plainDescription || `Книга «${result.book.title}» на Трансмагии.`,
    };
}

export default async function BookPage({ params }: { params: Promise<{ section: string; bookSlug: string }> }) {
    const { section: rawSection, bookSlug: rawBookSlug } = await params;
    const sectionSlug = decodeParam(rawSection);
    const bookSlug = decodeParam(rawBookSlug);
    const result = await getPublishedBook(sectionSlug, bookSlug);
    if (!result) notFound();

    const profile = await getCurrentProfile();
    if (!profile) {
        redirect(`/login?next=/${encodeURIComponent(sectionSlug)}/${encodeURIComponent(bookSlug)}`);
    }

    const canRead = await canReadSection(result.section.id);
    if (!canRead) {
        return (
            <div className="min-h-screen bg-muted/40">
                <ReaderHeader sectionName={result.section.name} bookTitle={result.book.title} />
                <main className="px-5 py-20">
                    <SectionGate sectionId={result.section.id} redirectTo={`/${sectionSlug}/${bookSlug}`} />
                </main>
            </div>
        );
    }

    const [chapters, readIds] = await Promise.all([
        getPublishedChapters(result.book.id),
        getReadChapterIdsForBook(profile.id, result.book.id),
    ]);

    return (
        <div className="min-h-screen bg-muted/40">
            <ReaderHeader sectionName={result.section.name} bookTitle={result.book.title} />
            <main className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-16">
                <Link href={`/${sectionSlug}`} className="reader-link">← К разделу</Link>
                <section className="mt-8 grid gap-8 md:grid-cols-[12rem_1fr]">
                    {result.book.coverImageUrl ? (
                        <img className="aspect-[2/3] w-full object-cover" src={result.book.coverImageUrl} alt={`Обложка книги «${result.book.title}»`} />
                    ) : <div className="grid aspect-[2/3] place-items-center bg-accent font-reader text-5xl text-accent-foreground">Т</div>}
                    <div>
                        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Книга</p>
                        <h1 className="font-reader text-4xl tracking-tight sm:text-5xl">{result.book.title}</h1>
                        {result.book.author && <p className="mt-3 text-lg text-muted-foreground">{result.book.author}</p>}
                        {result.book.description && <div className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground"><TiptapRenderer content={result.book.description} className="book-description" /></div>}
                        {result.section.isProtected && <p className="mt-6 text-sm font-semibold text-amber-800">Раздел доступен после проверки пароля или входа.</p>}
                    </div>
                </section>
                <section className="mt-14">
                    <h2 className="font-reader text-3xl tracking-tight">Главы</h2>
                    {chapters.length > 0 ? (
                        <ol className="mt-5 divide-y divide-border border-y border-border ps-0">
                            {chapters.map((chapter) => {
                                const isRead = readIds.has(chapter.id);
                                return (
                                    <li key={chapter.id} className="block">
                                        <Link className="flex w-full items-center justify-between gap-4 py-4 hover:bg-background/70 hover:underline" href={`/${result.section.slug}/${result.book.slug}/${chapter.slug}`}>
                                            <span className="flex min-w-0 items-center gap-2">
                                                {isRead && (
                                                    <Check
                                                        size={15}
                                                        strokeWidth={2.5}
                                                        className="chapter-read-icon"
                                                        aria-label="Прочитано"
                                                    />
                                                )}
                                                <span className="min-w-0">
                                                    <span className="mr-3 text-sm text-muted-foreground">{chapter.sortOrder}.</span>{chapter.title}
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-sm text-muted-foreground">Читать →</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ol>
                    ) : <p className="mt-5 text-muted-foreground">Опубликованных глав пока нет.</p>}
                </section>
            </main>
        </div>
    );
}
