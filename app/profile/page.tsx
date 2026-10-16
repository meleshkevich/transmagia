import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { ReaderHeader } from "@/components/reader/reader-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Мой профиль" };

export default async function ProfilePage() {
    const profile = await getCurrentProfile();
    if (!profile) {
        redirect("/login?next=/profile");
    }

    const user = await getCurrentUser();
    const email = user?.email ?? "";

    const displayName = profile.display_name?.trim() || null;

    return (
        <div className="min-h-screen bg-muted/40">
            <ReaderHeader sectionName="Мой профиль" />
            <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8 lg:py-16">
                <Link href="/" className="reader-link">← На главную</Link>
                <article className="mt-10 border border-border bg-background p-7 sm:p-10">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Трансмагия
                    </p>
                    <h1 className="font-reader text-4xl tracking-tight">Мой профиль</h1>
                    <p className="mt-4 leading-7 text-muted-foreground">
                        {displayName
                            ? `Приветствуем тебя, ${displayName}!`
                            : "Приветствуем тебя, путник!"}
                    </p>
                    <div className="mt-8">
                        <ProfileForm email={email} initialDisplayName={profile.display_name} />
                    </div>
                </article>
            </main>
        </div>
    );
}
