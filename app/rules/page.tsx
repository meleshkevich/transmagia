import type { Metadata } from "next";
import Link from "next/link";

import { ReaderHeader } from "@/components/reader/reader-header";

export const metadata: Metadata = {
    title: "Правила пользования сайтом",
    description: "Правила пользования сайтом Трансмагия.",
};

export default function RulesPage() {
    return (
        <div className="min-h-screen bg-muted/40">
            <ReaderHeader />
            <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8 lg:py-16">
                <Link href="/" className="reader-link">← На главную</Link>
                <article className="mt-10 border border-border bg-background p-7 sm:p-10">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Трансмагия</p>
                    <h1 className="font-reader text-4xl tracking-tight">Правила пользования сайтом</h1>
                    <div className="mt-8 space-y-5 leading-8 text-muted-foreground">
                        <p>Уважаемый читатель!</p>

                        <p>Мы рады Вас приветствовать на сайте Трансмагия с новеллами, фанфиками и переводами.</p>

                        <p>Мы настоятельно рекомендуем для Вашего комфорта ознакомится с правилами нашего дома:</p>

                        <ol>
                            <li>1.  Все материалы относятся к категории 18+. Заходя на сайт, Вы сами берёте на себя ответственность за чтение размещённых материалов.</li>
                            <li>2.  Категорически запрещается вынос текстов и материалов за пределы сайта, размещение на сторонних платформах и упоминания сайта в социальных сетях — если таковое не было согласовано с администрацией сайта. Это для общей безопасности.</li>
                            <li>3.  Запрещено ссориться, выяснять отношения и устраивать срач в комментариях.</li>
                            <li>4.  НИКАКОЙ ПОЛИТИКИ!</li>
                            <li>5.  НИКАКОЙ РЕЛИГИИ!</li>
                            <li>6.  НИКАКИХ ГОМОФОБНЫХ ВЫСКАЗЫВАНИЙ!</li>
                            <li>7.  Пиар и ссылки на сторонние порталы, сайты и т.д. запрещены.</li>
                        </ol>

                        <p>Просьба со всей серьёзностью отнестись к правилам и надеемся на понимание!</p>

                        <p>Приятного чтения!</p>

                        <p>Ваша Трансмагия</p>
                    </div>
                </article>
            </main>
        </div>
    );
}
