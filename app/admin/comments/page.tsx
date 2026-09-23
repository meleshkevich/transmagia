import { DeleteCommentButton } from "@/components/admin/delete-comment-button";
import { getAdminComments } from "@/lib/admin/comments";

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

export default async function AdminCommentsPage() {
    const comments = await getAdminComments();

    return (
        <section>
            <div className="admin-page-heading">
                <div>
                    <p className="admin-eyebrow">Модерация</p>
                    <h1>Комментарии</h1>
                    <p className="admin-muted">Управление комментариями читателей.</p>
                </div>
            </div>
            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Автор</th>
                            <th>Комментарий</th>
                            <th>Глава / Книга</th>
                            <th>Дата</th>
                            <th>Статус</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {comments.map((comment) => (
                            <tr key={comment.id}>
                                <td>
                                    <span className="admin-table-title" style={{ cursor: "default" }}>
                                        {comment.authorName}
                                    </span>
                                </td>
                                <td>
                                    <span className="admin-comment-excerpt">
                                        {comment.content.length > 120
                                            ? comment.content.slice(0, 120) + "…"
                                            : comment.content}
                                    </span>
                                </td>
                                <td>
                                    <span className="admin-table-title" style={{ cursor: "default" }}>
                                        {comment.chapterTitle}
                                    </span>
                                    <span className="admin-table-subtitle">{comment.bookTitle}</span>
                                </td>
                                <td>
                                    <time dateTime={comment.createdAt}>
                                        {dateFormat.format(new Date(comment.createdAt))}
                                    </time>
                                </td>
                                <td>
                                    <span className={`admin-status admin-status-${comment.status}`}>
                                        {comment.status === "published" ? "Опубликован" : "Удалён"}
                                    </span>
                                </td>
                                <td>
                                    {comment.status === "published" && (
                                        <DeleteCommentButton commentId={comment.id} />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {comments.length === 0 && (
                    <p className="admin-empty">Комментариев пока нет.</p>
                )}
            </div>
        </section>
    );
}
