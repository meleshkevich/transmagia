import type { Metadata } from "next";
import Link from "next/link";

import { ReaderHeader } from "@/components/reader/reader-header";

export const metadata: Metadata = {
    title: "Политика конфиденциальности",
    description: "Политика конфиденциальности сайта Трансмагия.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-muted/40">
            <ReaderHeader />
            <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8 lg:py-16">
                <Link href="/" className="reader-link">← На главную</Link>
                <article className="mt-10 border border-border bg-background p-7 sm:p-10">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Трансмагия</p>
                    <h1 className="font-reader text-4xl tracking-tight">Политика конфиденциальности</h1>
                    <p className="mt-4 text-sm text-muted-foreground">Последнее обновление: октябрь 2026 г.</p>

                    <div className="mt-8 space-y-8 leading-7 text-muted-foreground">

                        {/* 1 */}
                        <section>
                            <h2 className="mb-3 font-reader text-2xl text-foreground">1. Общие положения</h2>
                            <p>
                                Трансмагия (transmagia.house) — личный некоммерческий проект, онлайн-библиотека
                                произведений на русском языке. Мы уважаем конфиденциальность наших читателей
                                и авторов и стремимся обрабатывать персональные данные в минимально необходимом
                                объёме.
                            </p>
                            <p className="mt-3">
                                Настоящая политика описывает, какие данные мы собираем, как их используем и
                                какие права есть у пользователей сайта. Некоммерческий характер проекта не
                                освобождает нас от соблюдения применимых правил защиты данных,
                                в том числе Общего регламента по защите данных ЕС (GDPR), поскольку сайт
                                доступен пользователям из Европейского экономического пространства.
                            </p>
                        </section>

                        {/* 2 */}
                        <section>
                            <h2 className="mb-3 font-reader text-2xl text-foreground">2. Кто отвечает за обработку данных</h2>
                            <p>
                                Оператором персональных данных является{" "}
                                <strong>Ив Венс Шер</strong>.
                            </p>
                            <p className="mt-3">
                                Непосредственный технический доступ к базе данных имеет только владелец
                                проекта. Остальные администраторы управляют контентом через защищённый
                                веб-интерфейс сайта.
                            </p>
                            <p className="mt-3">
                                По всем вопросам, связанным с обработкой персональных данных, обращайтесь:{" "}
                                <a href="mailto:iv.venscher@gmail.com" className="reader-link">
                                    iv.venscher@gmail.com
                                </a>
                                .
                            </p>
                        </section>

                        {/* 3 */}
                        <section>
                            <h2 className="mb-3 font-reader text-2xl text-foreground">3. Какие данные мы обрабатываем</h2>
                            <p>При регистрации и использовании сайта мы обрабатываем следующие данные:</p>
                            <ul className="mt-3 space-y-2 pl-5">
                                <li>
                                    <strong>Адрес электронной почты</strong> — используется для входа
                                    в аккаунт и подтверждения регистрации. Хранится в системе аутентификации
                                    Supabase.
                                </li>
                                <li>
                                    <strong>Псевдоним (display name)</strong> — отображаемое имя в
                                    комментариях. Указывается по желанию; при отсутствии отображается
                                    как «Читатель».
                                </li>
                                <li>
                                    <strong>Уникальный идентификатор аккаунта</strong> — технический
                                    UUID, используемый внутри системы.
                                </li>
                                <li>
                                    <strong>Данные аутентификации и сессий</strong> — информация о входе
                                    в систему, обрабатываемая Supabase. Хранится в HttpOnly-куках на
                                    стороне браузера.
                                </li>
                                <li>
                                    <strong>Комментарии</strong> — текст комментариев, дата публикации,
                                    связь с аккаунтом автора.
                                </li>
                                <li>
                                    <strong>Прогресс чтения</strong> — запись о том, какие главы
                                    отмечены прочитанными, с указанием даты и времени.
                                </li>
                            </ul>
                            <p className="mt-4">
                                Мы <strong>не собираем</strong>: имена, фамилии, телефонные номера,
                                почтовые адреса, платёжные данные. Номер телефона и другие
                                дополнительные сведения не запрашиваются при регистрации.
                            </p>
                        </section>

                        {/* 4 */}
                        <section>
                            <h2 className="mb-3 font-reader text-2xl text-foreground">4. Для чего используются данные</h2>
                            <ul className="space-y-2 pl-5">
                                <li>Создание и ведение аккаунта читателя.</li>
                                <li>Вход на сайт и поддержание сессии.</li>
                                <li>Доступ к защищённым разделам (например, разделу переводов).</li>
                                <li>Публикация комментариев к произведениям.</li>
                                <li>Отслеживание прогресса чтения.</li>
                                <li>Отправка системных писем — например, для подтверждения email при регистрации или при смене пароля.</li>
                                <li>Администрирование сайта (управление аккаунтами администраторами).</li>
                                <li>Обеспечение безопасности и защиты от несанкционированного доступа.</li>
                            </ul>
                            <p className="mt-4">
                                Мы <strong>не используем</strong> персональные данные в рекламных целях,
                                не передаём их третьим лицам для маркетинга и не продаём.
                            </p>
                        </section>

                        {/* 5 */}
                        <section>
                            <h2 className="mb-3 font-reader text-2xl text-foreground">5. Правовые основания обработки</h2>
                            <ul className="space-y-3 pl-5">
                                <li>
                                    <strong>Исполнение договора (ст. 6(1)(b) GDPR)</strong> —
                                    обработка email, данных сессии, комментариев и прогресса чтения
                                    необходима для предоставления функций сайта, на использование
                                    которых вы зарегистрировались.
                                </li>
                                <li>
                                    <strong>Законные интересы (ст. 6(1)(f) GDPR)</strong> —
                                    технические меры безопасности и доступ администраторов к данным
                                    аккаунтов в целях управления платформой.
                                </li>
                            </ul>
                        </section>

                        {/* 6 */}
                        <section>
                            <h2 className="mb-3 font-reader text-2xl text-foreground">6. Где и кем обрабатываются данные</h2>
                            <p>Для работы сайта мы привлекаем следующих обработчиков:</p>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <p className="font-semibold text-foreground">Supabase</p>
                                    <p>
                                        Поставщик базы данных и сервиса аутентификации. Хранит данные
                                        аккаунтов, комментарии и прогресс чтения. Регион хранения
                                        данных: <strong>Великобритания, Лондон (регион West Europe)</strong>.
                                        Supabase Inc. работает в соответствии с условиями обработки данных
                                        (DPA). Дополнительная информация:{" "}
                                        <span className="text-foreground">supabase.com/privacy</span>.
                                    </p>
                                </div>

                                <div>
                                    <p className="font-semibold text-foreground">Vercel</p>
                                    <p>
                                        Платформа для хостинга приложения. Может обрабатывать технические
                                        данные запросов (IP-адрес, заголовки) в рамках работы
                                        инфраструктуры. Дополнительная информация:{" "}
                                        <span className="text-foreground">vercel.com/legal/privacy-policy</span>.
                                    </p>
                                </div>

                                <div>
                                    <p className="font-semibold text-foreground">Supabase Auth (email)</p>
                                    <p>
                                        Системные письма (подтверждение email, восстановление пароля)
                                        отправляются через встроенный сервис Supabase Auth. Для доставки
                                        писем ваш email-адрес передаётся почтовой инфраструктуре Supabase.
                                    </p>
                                </div>

                                <div>
                                    <p className="font-semibold text-foreground">Администраторы</p>
                                    <p>
                                        Проект администрируется несколькими людьми, находящимися в странах Европы. Прямой доступ к базе
                                        данных имеет только владелец проекта. Остальные администраторы
                                        работают через защищённый веб-интерфейс сайта и в рамках своих
                                        задач могут видеть email-адреса зарегистрированных пользователей.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 7 */}
                        <section>
                            <h2 className="mb-3 font-reader text-2xl text-foreground">7. Использование cookies</h2>
                            <p>
                                Сайт использует только технически необходимые файлы cookie. Мы не
                                устанавливаем аналитические, рекламные или отслеживающие cookie.
                            </p>

                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-left text-foreground">
                                            <th className="pb-2 pr-4 font-semibold">Cookie</th>
                                            <th className="pb-2 pr-4 font-semibold">Назначение</th>
                                            <th className="pb-2 pr-4 font-semibold">Срок</th>
                                            <th className="pb-2 font-semibold">Тип</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        <tr>
                                            <td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token</td>
                                            <td className="py-2 pr-4">Сессия Supabase Auth — поддерживает вход в аккаунт</td>
                                            <td className="py-2 pr-4">До выхода из аккаунта или истечения сессии</td>
                                            <td className="py-2">Первичный, HttpOnly</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 pr-4 font-mono text-xs">transmagia_section_access_*</td>
                                            <td className="py-2 pr-4">Доступ к защищённому разделу (переводы) после ввода пароля раздела</td>
                                            <td className="py-2 pr-4">7 дней</td>
                                            <td className="py-2">Первичный, HttpOnly</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <p className="mt-4">
                                Все cookie являются первичными (устанавливаются непосредственно сайтом),
                                HttpOnly (недоступны JavaScript-коду), используются исключительно для
                                обеспечения работы сайта и не содержат данных, используемых для
                                аналитики или рекламы.
                            </p>
                            <p className="mt-3">
                                Дополнительно браузер сохраняет в{" "}
                                <code className="rounded bg-muted px-1 text-xs">localStorage</code>{" "}
                                настройки читалки (размер шрифта, межстрочный интервал, тема). Эти
                                данные не содержат персональной информации и не передаются на сервер.
                            </p>
                            <p className="mt-3">
                                Поскольку все файлы cookie строго необходимы для работы сайта,
                                всплывающее окно согласия на cookie не отображается.
                            </p>
                        </section>

                        {/* 8 */}
                        <section>
                            <h2 className="mb-3 font-reader text-2xl text-foreground">8. Сроки хранения данных</h2>
                            <ul className="space-y-2 pl-5">
                                <li>
                                    <strong>Данные аккаунта и прогресс чтения</strong> — хранятся до
                                    удаления аккаунта.
                                </li>
                                <li>
                                    <strong>Комментарии</strong> — при удалении аккаунта связь
                                    комментария с автором (user_id) обнуляется; текст комментария
                                    сохраняется в анонимной форме.
                                </li>
                                <li>
                                    <strong>Записи о доставке email и иные применимые записи</strong> —
                                    оператор устанавливает общий целевой срок хранения 6 месяцев.
                                </li>
                                <li>
                                    <strong>Технические журналы и резервные копии</strong> —
                                    сроки хранения определяются конфигурацией и политиками Supabase и Vercel.
                                </li>
                            </ul>
                            <p className="mt-4">
                                Мы не гарантируем немедленного удаления данных из резервных копий
                                провайдеров, поскольку сроки их ротации определяются провайдерами
                                инфраструктуры.
                            </p>
                        </section>

                        {/* 9 */}
                        <section>
                            <h2 className="mb-3 font-reader text-2xl text-foreground">9. Удаление аккаунта</h2>
                            <p>
                                Вы можете запросить удаление аккаунта, обратившись к администратору.
                                При удалении аккаунта:
                            </p>
                            <ul className="mt-3 space-y-1 pl-5">
                                <li>аккаунт и связанные с ним персональные данные удаляются;</li>
                                <li>прогресс чтения удаляется;</li>
                                <li>
                                    комментарии сохраняются в анонимной форме — без email-адреса,
                                    идентификатора аккаунта и иных данных, позволяющих установить
                                    личность автора.
                                </li>
                            </ul>
                        </section>

                        {/* 10 */}
                        <section>
                            <h2 className="mb-3 font-reader text-2xl text-foreground">10. Права пользователей</h2>
                            <p>
                                В соответствии с применимым законодательством о защите данных вы имеете
                                право:
                            </p>
                            <ul className="mt-3 space-y-1 pl-5">
                                <li>получить доступ к своим персональным данным;</li>
                                <li>исправить неточные данные;</li>
                                <li>потребовать удаления данных («право на забвение»);</li>
                                <li>возразить против обработки или потребовать её ограничения;</li>
                                <li>получить копию своих данных в машиночитаемом формате (право на переносимость);</li>
                                <li>
                                    подать жалобу в надзорный орган по защите данных — в Чешской
                                    Республике это Úřad pro ochranu osobních údajů (ÚOOÚ),{" "}
                                    <span className="text-foreground">uoou.cz</span>.
                                </li>
                            </ul>
                            <p className="mt-4">
                                Для реализации своих прав свяжитесь с нами:{" "}
                                <a href="mailto:iv.venscher@gmail.com" className="reader-link">
                                    iv.venscher@gmail.com
                                </a>
                                .
                            </p>
                        </section>

                        {/* 11 */}
                        <section>
                            <h2 className="mb-3 font-reader text-2xl text-foreground">11. Как связаться с нами</h2>
                            <p>
                                По вопросам, связанным с обработкой персональных данных, а также для
                                реализации своих прав обращайтесь:{" "}
                                <a href="mailto:iv.venscher@gmail.com" className="reader-link">
                                    iv.venscher@gmail.com
                                </a>
                                .
                            </p>
                            <p className="mt-3">
                                Также вы можете воспользоваться{" "}
                                <Link href="/contacts" className="reader-link">формой обратной связи</Link>.
                            </p>
                        </section>

                        {/* 12 */}
                        <section>
                            <h2 className="mb-3 font-reader text-2xl text-foreground">12. Изменения политики</h2>
                            <p>
                                Мы можем обновлять настоящую политику в связи с изменениями в работе
                                сайта или требованиями законодательства. Дата последнего обновления
                                указана в начале документа. При существенных изменениях мы постараемся
                                уведомить об этом зарегистрированных пользователей.
                            </p>
                        </section>

                    </div>
                </article>
            </main>
        </div>
    );
}
