import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
    const response = NextResponse.next({ request });
    return updateSupabaseSession(request, response);
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
    ],
};
