import Link from "next/link";

import { getAdminBooks } from "@/lib/admin/data";

export default async function AdminBooksPage() {
    const books = await getAdminBooks();
    return (
        <section>
            <div className="admin-page-heading">
                <div><p className="admin-eyebrow">Контент</p><h1>Книги</h1><p className="admin-muted">Книги, главы и публикации проекта.</p></div>
                <Link href="/admin/books/new" className="admin-primary-button">Создать книгу</Link>
            </div>
            <div className="admin-table-wrap">
                <table className="admin-table"><thead><tr><th>Книга</th><th>Раздел</th><th>Статус</th><th>Главы</th><th>Изменена</th><th /></tr></thead>
                    <tbody>{books.map((book) => <tr key={book.id}>
                        <td><Link className="admin-table-title" href={`/admin/books/${book.id}`}>{book.title}</Link>{book.author && <span className="admin-table-subtitle">{book.author}</span>}</td>
                        <td>{book.sectionName}</td><td><span className={`admin-status admin-status-${book.status}`}>{book.status === "published" ? "Опубликована" : "Черновик"}</span></td><td>{book.chapterCount}</td>
                        <td>{new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(book.updatedAt))}</td><td><Link href={`/admin/books/${book.id}`} className="admin-table-action">Открыть</Link></td>
                    </tr>)}</tbody>
                </table>
                {books.length === 0 && <p className="admin-empty">Книг пока нет. Создайте первую книгу.</p>}
            </div>
        </section>
    );
}
