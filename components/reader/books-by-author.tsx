import type { ReaderBook } from "@/lib/reader/data";
import { groupBooksByAuthor } from "@/lib/reader/group-by-author";
import { BookCard } from "./book-card";

export function BooksByAuthor({ books }: { books: ReaderBook[] }) {
    const groups = groupBooksByAuthor(books);

    return (
        <div className="space-y-12">
            {groups.map(({ author, books: groupBooks }) => (
                <section key={author}>
                    <h2 className="mb-6 font-reader text-2xl tracking-tight text-foreground">
                        {author}
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {groupBooks.map((book) => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
