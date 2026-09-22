const CYRILLIC_MAP: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d",
    е: "e", ж: "zh", з: "z", и: "i",
    й: "y", к: "k", л: "l", м: "m", н: "n",
    о: "o", п: "p", р: "r", с: "s", т: "t",
    у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
    ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "",
    э: "e", ю: "yu", я: "ya",
};

const CYRILLIC_VOWELS = new Set(["а", "е", "ё", "и", "о", "у", "ы", "э", "ю", "я"]);

function isCyrillicConsonant(ch: string): boolean {
    const lower = ch.toLowerCase();
    return /[а-яё]/.test(lower) && !CYRILLIC_VOWELS.has(lower) && lower !== "ъ" && lower !== "ь";
}

export function transliterate(text: string): string {
    const chars = [...text];
    let result = "";
    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        const lower = ch.toLowerCase();
        if (lower === "ё") {
            const prev = i > 0 ? chars[i - 1] : "";
            result += isCyrillicConsonant(prev) ? "e" : "yo";
        } else if (lower in CYRILLIC_MAP) {
            result += CYRILLIC_MAP[lower];
        } else {
            result += ch;
        }
    }
    return result;
}

export function slugify(value: string): string {
    return transliterate(value)
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "") || "untitled";
}

export function findUniqueSuffix(baseSlug: string, used: Set<string>): string {
    if (!used.has(baseSlug)) return baseSlug;
    let n = 2;
    while (used.has(`${baseSlug}-${n}`)) n++;
    return `${baseSlug}-${n}`;
}
