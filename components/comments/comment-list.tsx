import type { ChapterComment } from "@/lib/reader/comments";
import { canDeleteComment } from "@/lib/reader/comments";
import { DeleteCommentButton } from "./delete-comment-button";

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

export function CommentList({
    comments,
    currentUserId,
    currentIsAdmin,
}: {
    comments: ChapterComment[];
    currentUserId?: string | null;
    currentIsAdmin?: boolean;
}) {
    const viewerProfile =
        currentUserId ? { id: currentUserId, is_admin: currentIsAdmin ?? false } : null;

    if (comments.length === 0) {
        return <p className="comment-empty">Комментариев пока нет. Будьте первым!</p>;
    }

    return (
        <ol className="comment-list">
            {comments.map((comment) => (
                <li key={comment.id} className="comment-item">
                    <div className="comment-meta">
                        <span className="comment-author">{comment.authorName}</span>
                        <time className="comment-date" dateTime={comment.createdAt}>
                            {dateFormat.format(new Date(comment.createdAt))}
                        </time>
                        {canDeleteComment(viewerProfile, comment.userId) && (
                            <DeleteCommentButton commentId={comment.id} />
                        )}
                    </div>
                    <p className="comment-body">{comment.content}</p>
                </li>
            ))}
        </ol>
    );
}
