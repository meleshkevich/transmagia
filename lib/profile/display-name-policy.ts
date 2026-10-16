const MAX_DISPLAY_NAME_LENGTH = 40;

// Matches control characters excluding tab (0x09), newline (0x0A), carriage return (0x0D)
const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

export type DisplayNameValidationResult =
    | { valid: true; normalizedValue: string | null }
    | { valid: false; error: string };

export function validateDisplayName(raw: string): DisplayNameValidationResult {
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
        return { valid: true, normalizedValue: null };
    }

    if (CONTROL_CHAR_RE.test(trimmed)) {
        return { valid: false, error: "Имя содержит недопустимые символы." };
    }

    if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
        return { valid: false, error: `Имя не должно превышать ${MAX_DISPLAY_NAME_LENGTH} символов.` };
    }

    return { valid: true, normalizedValue: trimmed };
}

export { MAX_DISPLAY_NAME_LENGTH };
