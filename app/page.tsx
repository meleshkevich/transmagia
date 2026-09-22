import { ArrowRight, BookOpen, Feather, Menu } from "lucide-react";
import Link from "next/link";

import { AuthNav } from "@/components/auth/auth-nav";

const navigation = [
  { href: "#about", label: "О нас" },
  { href: "#catalog", label: "Каталог" },
  { href: "/rules", label: "Правила пользования сайтом" },
  { href: "/contacts", label: "Контакты" },
];

const sections = [
  {
    href: "/originals",
    title: "Оригинальные новеллы",
    description: "Истории, созданные авторами Трансмагии.",
    accent: "bg-amber-100 text-amber-950",
  },
  {
    href: "/fanfiction",
    title: "Фанфики",
    description: "Новые грани знакомых миров и героев.",
    accent: "bg-rose-100 text-rose-950",
  },
  {
    href: "/translations",
    title: "Переводы",
    description: "Избранные произведения со всего мира.",
    accent: "bg-teal-100 text-teal-950",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-background/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="Трансмагия, на главную">
            <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
              <Feather className="size-5" aria-hidden="true" />
            </span>
            <span className="font-reader text-xl font-semibold tracking-tight">Трансмагия</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Основная навигация">
            {navigation.map((item) => (
              item.href.startsWith("#") ? (
                <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">{item.label}</a>
              ) : (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">{item.label}</Link>
              )
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <AuthNav />
            <button className="rounded-md p-2 text-muted-foreground md:hidden" aria-label="Открыть меню">
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section id="about" className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-28 lg:pt-28">
          <div className="max-w-2xl self-center">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Электронная библиотека</p>
            <h1 className="font-reader text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl">Истории, к которым хочется возвращаться.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">Оригинальные новеллы, фанфики и переводы в спокойном пространстве для чтения.</p>
            <a href="#catalog" className="mt-9 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">
              Открыть каталог <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
          <div className="relative min-h-72 overflow-hidden rounded-2xl bg-[#dfe8e1] p-8 sm:min-h-96 lg:min-h-[27rem]">
            <div className="absolute -right-16 -top-20 size-64 rounded-full border-[32px] border-white/50" aria-hidden="true" />
            <div className="absolute bottom-8 left-8 max-w-xs rounded-lg bg-white/80 p-5 backdrop-blur-sm">
              <BookOpen className="mb-8 size-6 text-teal-800" aria-hidden="true" />
              <p className="font-reader text-2xl leading-tight text-teal-950">Читайте в своём ритме</p>
            </div>
          </div>
        </section>

        <section id="catalog" className="border-y border-border/70 bg-muted/40">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
            <div className="mb-9 flex items-end justify-between gap-6">
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Разделы</p>
                <h2 className="font-reader text-3xl tracking-tight sm:text-4xl">Выберите свою историю</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {sections.map((section) => (
                <Link key={section.href} href={section.href} className="group border border-border bg-background p-6 transition-all hover:-translate-y-1 hover:border-foreground/40">
                  <span className={`mb-12 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${section.accent}`}>Открыть раздел</span>
                  <h3 className="font-reader text-2xl leading-tight">{section.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{section.description}</p>
                  <ArrowRight className="mt-8 size-5 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="contacts" className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <span>Трансмагия, 2026</span>
        <div className="flex gap-5">
          <Link href="/rules" className="hover:text-foreground">Правила</Link>
          <Link href="/contacts" className="hover:text-foreground">Контакты</Link>
        </div>
      </footer>
    </div>
  );
}
