import { SectionPasswordForm } from "@/components/auth/section-password-form";

export function SectionGate({ sectionId, redirectTo }: { sectionId: string; redirectTo: string }) {
    return (
        <section className="mx-auto max-w-md border border-border bg-background p-6 shadow-sm sm:p-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Закрытый раздел</p>
            <h2 className="font-reader text-2xl tracking-tight">Для чтения этого раздела требуется пароль</h2>
            <p className="mt-3 mb-6 text-sm leading-6 text-muted-foreground">Введите пароль раздела. Доступ будет сохранён только для этого раздела и на ограниченное время.</p>
            <SectionPasswordForm sectionId={sectionId} redirectTo={redirectTo} />
        </section>
    );
}
