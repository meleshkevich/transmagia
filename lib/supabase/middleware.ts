import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

export async function updateSupabaseSession(request: NextRequest, response: NextResponse) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !publishableKey) {
        return response;
    }

    const supabase = createServerClient(supabaseUrl, publishableKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    request.cookies.set(name, value);
                    response.cookies.set(name, value, options);
                });
            },
        },
    });

    await supabase.auth.getUser();
    return response;
}
