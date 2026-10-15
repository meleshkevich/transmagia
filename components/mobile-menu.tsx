"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navigation = [
    { href: "#about", label: "О нас" },
    { href: "#catalog", label: "Каталог" },
    { href: "/rules", label: "Правила пользования сайтом" },
    { href: "/contacts", label: "Контакты" },
];

interface MobileMenuProps {
    isAuthenticated: boolean;
}

export function MobileMenu({ isAuthenticated }: MobileMenuProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative md:hidden">
            <button
                type="button"
                className="rounded-md p-2 text-muted-foreground hover:text-foreground"
                aria-label={open ? "Закрыть меню" : "Открыть меню"}
                aria-expanded={open}
                aria-controls="mobile-nav"
                onClick={() => setOpen((v) => !v)}
            >
                {open ? (
                    <X className="size-5" aria-hidden="true" />
                ) : (
                    <Menu className="size-5" aria-hidden="true" />
                )}
            </button>
            {open && (
                <nav
                    id="mobile-nav"
                    className="absolute right-0 top-full z-50 mt-1 min-w-48 border border-border bg-background py-1 shadow-md"
                    aria-label="Мобильная навигация"
                >
                    {navigation.map((item) =>
                        item.href.startsWith("#") ? (
                            <a
                                key={item.href}
                                href={item.href}
                                className="block px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => setOpen(false)}
                            >
                                {item.label}
                            </a>
                        ) : (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="block px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => setOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ),
                    )}
                    {isAuthenticated && (
                        <Link
                            href="/my-books"
                            className="block px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => setOpen(false)}
                        >
                            Мои книги
                        </Link>
                    )}
                </nav>
            )}
        </div>
    );
}
