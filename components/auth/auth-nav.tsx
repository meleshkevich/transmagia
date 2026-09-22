import Link from "next/link";

import { getCurrentProfile } from "@/lib/auth/server";
import { LogoutForm } from "@/components/auth/logout-form";

export async function AuthNav() {
    const profile = await getCurrentProfile();

    if (!profile) {
        return (
            <div className="flex items-center gap-4 text-sm">
                <Link href="/login" className="text-muted-foreground hover:text-foreground">Войти</Link>
                <Link href="/register" className="font-semibold text-foreground">Зарегистрироваться</Link>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 text-sm">
            {profile.is_admin && <Link href="/admin" className="font-semibold text-foreground">Админка</Link>}
            <LogoutForm />
        </div>
    );
}
