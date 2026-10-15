import Link from "next/link";
import { LogIn } from "lucide-react";

import { getCurrentProfile } from "@/lib/auth/server";
import { LogoutForm } from "@/components/auth/logout-form";

export async function AuthNav() {
    const profile = await getCurrentProfile();

    if (!profile) {
        return (
            <div className="flex items-center">
                <Link
                    href="/login"
                    className="rounded p-1.5 text-muted-foreground hover:text-foreground"
                    aria-label="Войти"
                    title="Войти"
                >
                    <LogIn size={18} aria-hidden="true" />
                </Link>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-sm sm:gap-4">
            <Link href="/my-books" className="hidden text-muted-foreground hover:text-foreground md:inline">Мои книги</Link>
            {profile.is_admin && <Link href="/admin" className="font-semibold text-foreground">Админка</Link>}
            <LogoutForm />
        </div>
    );
}
