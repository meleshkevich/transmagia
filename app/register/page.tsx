import type { Metadata } from "next";

import { signUp } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
    title: "Зарегистрироваться",
};

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: Promise<{ registered?: string }>;
}) {
    const params = await searchParams;

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/40 px-5 py-12">
            <section className="w-full max-w-md border border-border bg-background p-7 shadow-sm sm:p-9">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Трансмагия</p>
                <h1 className="font-reader text-3xl tracking-tight">Зарегистрироваться</h1>
                <p className="mt-3 mb-8 text-sm leading-6 text-muted-foreground">Создайте аккаунт читателя. Права администратора назначаются отдельно и не передаются через форму.</p>
                <AuthForm mode="register" action={signUp} registered={params.registered === "1"} />
            </section>
        </main>
    );
}
