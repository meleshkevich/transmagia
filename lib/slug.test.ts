import { describe, expect, it } from "vitest";

import { findUniqueSuffix, slugify } from "./slug";

describe("slugify", () => {
    it("transliterates Russian titles to ASCII slugs", () => {
        expect(slugify("Шум дождя")).toBe("shum-dozhdya");
        expect(slugify("Глава 1")).toBe("glava-1");
        expect(slugify("Ёжик в тумане")).toBe("yozhik-v-tumane");
        expect(slugify("Часть 2: Возвращение")).toBe("chast-2-vozvrashchenie");
        expect(slugify("Пески времени или обратный отсчёт")).toBe("peski-vremeni-ili-obratnyy-otschet");
        expect(slugify("1. Жизнь — худшая из проявлений реальности")).toBe(
            "1-zhizn-khudshaya-iz-proyavleniy-realnosti",
        );
    });

    it("strips leading and trailing whitespace and repeated separators", () => {
        expect(slugify("  Тест --- текста!")).toBe("test-teksta");
        expect(slugify("  Multiple   spaces  ")).toBe("multiple-spaces");
    });

    it("handles punctuation", () => {
        expect(slugify("Часть 2: Возвращение")).toBe("chast-2-vozvrashchenie");
        expect(slugify("Книга!!! Супер???")).toBe("kniga-super");
    });

    it("handles mixed Russian and Latin input", () => {
        expect(slugify("Hello мир")).toBe("hello-mir");
    });

    it("preserves numbers", () => {
        expect(slugify("Книга 42")).toBe("kniga-42");
        expect(slugify("007 — агент")).toBe("007-agent");
    });

    it("returns untitled for empty or punctuation-only input", () => {
        expect(slugify("")).toBe("untitled");
        expect(slugify("---")).toBe("untitled");
        expect(slugify("   ")).toBe("untitled");
        expect(slugify("!!!")).toBe("untitled");
    });
});

describe("findUniqueSuffix", () => {
    it("returns baseSlug when not in used set", () => {
        expect(findUniqueSuffix("shum-dozhdya", new Set())).toBe("shum-dozhdya");
        expect(findUniqueSuffix("glava-1", new Set(["other-slug"]))).toBe("glava-1");
    });

    it("appends -2 when baseSlug is already taken", () => {
        expect(findUniqueSuffix("shum-dozhdya", new Set(["shum-dozhdya"]))).toBe("shum-dozhdya-2");
    });

    it("increments suffix until a free slot is found", () => {
        const used = new Set(["shum-dozhdya", "shum-dozhdya-2"]);
        expect(findUniqueSuffix("shum-dozhdya", used)).toBe("shum-dozhdya-3");
    });

    it("skips to the next free number when intermediate slots are taken", () => {
        const used = new Set(["slug", "slug-2", "slug-3", "slug-4"]);
        expect(findUniqueSuffix("slug", used)).toBe("slug-5");
    });
});
