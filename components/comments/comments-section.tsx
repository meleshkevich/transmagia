import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth/server";
import { getChapterComments } from "@/lib/reader/comments";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

export async function CommentsSection({ chapterId }: { chapterId: string }) {
    const [comments, profile] = await Promise.all([
        getChapterComments(chapterId),
        getCurrentProfile(),
    ]);

    const canComment = Boolean(profile);

    return (
        <section
            aria-label="Комментарии"
            className="comments-section mx-auto max-w-4xl px-5 py-8 lg:px-8"
        >
            <h2 className="comments-heading">Комментарии</h2>
            <CommentList
                comments={comments}
                currentUserId={profile?.id ?? null}
                currentIsAdmin={profile?.is_admin ?? false}
            />
            {canComment ? (
                <CommentForm chapterId={chapterId} />
            ) : (
                <p className="comment-login-prompt">
                    <Link href="/login" className="comment-login-link">
                        Войдите
                    </Link>
                    , чтобы оставить комментарий.
                </p>
            )}
        </section>
    );
}
