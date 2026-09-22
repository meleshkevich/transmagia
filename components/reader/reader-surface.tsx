"use client";

import type { CSSProperties, ReactNode } from "react";
import { startTransition, useEffect, useState } from "react";

import { Settings2 } from "lucide-react";

type FontSize = "small" | "medium" | "large" | "xlarge";
type LineHeight = "compact" | "normal" | "relaxed";
type Theme = "light" | "dark" | "system";

type Preferences = {
    fontSize: FontSize;
    lineHeight: LineHeight;
    theme: Theme;
};

const STORAGE_KEY = "transmagia-reader-preferences";
const defaultPreferences: Preferences = {
    fontSize: "medium",
    lineHeight: "normal",
    theme: "system",
};

function readPreferences(): Preferences {
    try {
        const value = window.localStorage.getItem(STORAGE_KEY);
        if (!value) return defaultPreferences;
        const parsed = JSON.parse(value) as Partial<Preferences>;
        return {
            fontSize: parsed.fontSize ?? defaultPreferences.fontSize,
            lineHeight: parsed.lineHeight ?? defaultPreferences.lineHeight,
            theme: parsed.theme ?? defaultPreferences.theme,
        };
    } catch {
        return defaultPreferences;
    }
}

function getSystemTheme(): "light" | "dark" {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ReaderSurface({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
    const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        startTransition(() => {
            setPreferences(readPreferences());
            setSystemTheme(getSystemTheme());
            setHydrated(true);
        });

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => setSystemTheme(getSystemTheme());
        media.addEventListener("change", handleChange);
        return () => media.removeEventListener("change", handleChange);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }, [hydrated, preferences]);

    const activeTheme = preferences.theme === "system" ? systemTheme : preferences.theme;
    const style = {
        "--reader-font-size": {
            small: "1.05rem",
            medium: "1.18rem",
            large: "1.32rem",
            xlarge: "1.48rem",
        }[preferences.fontSize],
        "--reader-line-height": {
            compact: "1.65",
            normal: "1.85",
            relaxed: "2.05",
        }[preferences.lineHeight],
    } as CSSProperties;

    function updatePreference<Key extends keyof Preferences>(key: Key, value: Preferences[Key]) {
        setPreferences((current) => ({ ...current, [key]: value }));
    }

    return (
        <div className="reader-surface" data-theme={activeTheme} style={style}>
            <div className="reader-toolbar">
                <button
                    type="button"
                    className="reader-settings-trigger"
                    aria-expanded={settingsOpen}
                    aria-controls="reader-settings"
                    onClick={() => setSettingsOpen((open) => !open)}
                >
                    <Settings2 className="size-4" aria-hidden="true" />
                    <span>Aa</span>
                    <span className="sr-only">Настройки чтения</span>
                </button>
                {settingsOpen && (
                    <div id="reader-settings" className="reader-settings" aria-label="Настройки чтения">
                        <fieldset>
                            <legend>Размер текста</legend>
                            <div className="reader-option-row">
                                {(["small", "medium", "large", "xlarge"] as FontSize[]).map((value) => (
                                    <button key={value} type="button" aria-pressed={preferences.fontSize === value} onClick={() => updatePreference("fontSize", value)}>
                                        {value === "small" ? "A-" : value === "xlarge" ? "A+" : "A"}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend>Интервал</legend>
                            <div className="reader-option-row">
                                {(["compact", "normal", "relaxed"] as LineHeight[]).map((value) => (
                                    <button key={value} type="button" aria-pressed={preferences.lineHeight === value} onClick={() => updatePreference("lineHeight", value)}>
                                        {value === "compact" ? "Плотный" : value === "normal" ? "Обычный" : "Свободный"}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend>Тема</legend>
                            <div className="reader-option-row">
                                {(["light", "dark", "system"] as Theme[]).map((value) => (
                                    <button key={value} type="button" aria-pressed={preferences.theme === value} onClick={() => updatePreference("theme", value)}>
                                        {value === "light" ? "Светлая" : value === "dark" ? "Тёмная" : "Системная"}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}
