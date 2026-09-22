import { signOut } from "@/app/actions/auth";

export function LogoutForm() {
    return (
        <form action={signOut}>
            <button type="submit" className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                Выйти
            </button>
        </form>
    );
}
