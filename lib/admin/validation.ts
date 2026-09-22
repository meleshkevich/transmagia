import "server-only";

import { slugify } from "@/lib/slug";

export type AdminStatus = "draft" | "published";

export { slugify };

export function parseStatus(value: FormDataEntryValue | null, publishValue?: FormDataEntryValue | null): AdminStatus {
    if (publishValue === "published") return "published";
    if (publishValue === "draft") return "draft";
    return value === "published" ? "published" : "draft";
}

export function requiredText(value: FormDataEntryValue | null, message: string): string {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text) throw new Error(message);
    return text;
}

export function optionalText(value: FormDataEntryValue | null): string | null {
    const text = typeof value === "string" ? value.trim() : "";
    return text || null;
}

export function parsePositiveInteger(value: FormDataEntryValue | null): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error("Порядок должен быть положительным числом.");
    return parsed;
}

export function validateImage(file: FormDataEntryValue | null, maxBytes: number): File | null {
    if (!(file instanceof File) || file.size === 0) return null;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) throw new Error("Поддерживаются только JPEG, PNG и WebP.");
    if (file.size > maxBytes) throw new Error("Изображение слишком большое.");
    return file;
}
