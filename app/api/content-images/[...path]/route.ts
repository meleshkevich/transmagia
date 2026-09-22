import { NextResponse } from "next/server";

import { canReadBook } from "@/lib/auth/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ path: string[] }> },
) {
    const { path } = await params;
    const [bookId, ...imagePath] = path;
    if (!bookId || imagePath.length === 0 || imagePath.some((part) => part === "..")) {
        return NextResponse.json({ message: "Некорректный путь." }, { status: 400 });
    }
    if (!(await canReadBook(bookId))) {
        return NextResponse.json({ message: "Доступ запрещён." }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
        .from("content-images")
        .createSignedUrl(`${bookId}/${imagePath.join("/")}`, 60 * 10);

    if (error || !data?.signedUrl) {
        return NextResponse.json({ message: "Изображение не найдено." }, { status: 404 });
    }

    return NextResponse.redirect(data.signedUrl);
}
