import { redirect } from "next/navigation";

export default async function AdminChaptersPage({ params }: { params: Promise<{ bookId: string }> }) {
    const { bookId } = await params;
    redirect(`/admin/books/${bookId}`);
}
