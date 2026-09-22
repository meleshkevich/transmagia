import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ path: string[] }> },
) {
    await requireAdmin();
    const { path } = await params;
    const storagePath = path.join("/");
    if (!storagePath || storagePath.includes("..")) {
        return NextResponse.json({ message: "Некорректный путь." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
        .from("content-images")
        .createSignedUrl(storagePath, 60 * 10);

    if (error || !data?.signedUrl) {
        return NextResponse.json({ message: "Изображение не найдено." }, { status: 404 });
    }

    return NextResponse.redirect(data.signedUrl);
}
