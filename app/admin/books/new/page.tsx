import Link from "next/link";

import { createBookAction } from "@/app/actions/cms";
import { BookForm } from "@/components/admin/book-form";
import { getAdminSections } from "@/lib/admin/data";

export default async function NewBookPage() {
    const sections = await getAdminSections();
    return <section className="admin-narrow-page"><Link href="/admin/books" className="admin-back-link">← К книгам</Link><div className="admin-page-heading"><div><p className="admin-eyebrow">Новая запись</p><h1>Создать книгу</h1></div></div><BookForm sections={sections} action={createBookAction} submitLabel="Создать книгу" /></section>;
}
