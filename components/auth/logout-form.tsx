import { LogOut } from "lucide-react";

import { signOut } from "@/app/actions/auth";

export function LogoutForm() {
    return (
        <form action={signOut}>
            <button
                type="submit"
                className="cursor-pointer rounded p-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Выйти"
                title="Выйти"
            >
                <LogOut size={18} aria-hidden="true" />
            </button>
        </form>
    );
}
