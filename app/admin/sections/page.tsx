import { SectionPasswordManageForm } from "@/components/admin/section-password-manage-form";
import { getAdminSections } from "@/lib/admin/data";

export default async function AdminSectionsPage() {
    const sections = await getAdminSections();

    return (
        <section>
            <div className="admin-page-heading">
                <div>
                    <p className="admin-eyebrow">Управление</p>
                    <h1>Разделы</h1>
                    <p className="admin-muted">Управление паролями разделов. Пароль раздела требуется от зарегистрированных читателей при первом входе в закрытый раздел.</p>
                </div>
            </div>
            <div className="space-y-6">
                {sections.map((section) => (
                    <div key={section.id} className="border border-border bg-background p-6">
                        <div className="mb-6">
                            <h2 className="font-semibold">{section.name}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                /{section.slug} &mdash;{" "}
                                {section.isProtected ? (
                                    <span className="font-medium text-amber-700 dark:text-amber-500">Защищён паролем</span>
                                ) : (
                                    <span>Без пароля</span>
                                )}
                            </p>
                        </div>
                        <SectionPasswordManageForm sectionId={section.id} isProtected={section.isProtected} />
                    </div>
                ))}
                {sections.length === 0 && (
                    <p className="admin-empty">Разделы не найдены.</p>
                )}
            </div>
        </section>
    );
}
