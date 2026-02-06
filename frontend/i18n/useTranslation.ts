"use client";

import { useCallback } from "react";
import { useLocale } from "./LocaleContext";

/**
 * Resolve a dot-separated key from a nested dictionary.
 * e.g. "login.title" → dictionary.login.title
 */
function resolve(dict: Record<string, any>, key: string): string | undefined {
    const parts = key.split(".");
    let current: any = dict;
    for (const part of parts) {
        if (current == null || typeof current !== "object") return undefined;
        current = current[part];
    }
    return typeof current === "string" ? current : undefined;
}

/**
 * Interpolate {var} placeholders in a string.
 * e.g. "Étape {step}/3" with { step: 2 } → "Étape 2/3"
 */
function interpolate(template: string, vars: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (_, varName) => {
        return vars[varName] != null ? String(vars[varName]) : `{${varName}}`;
    });
}

export function useTranslation() {
    const { dictionary, locale } = useLocale();

    const t = useCallback(
        (key: string, vars?: Record<string, any>): string => {
            // Pluralization: if vars.count is provided, try _one/_other suffixes
            if (vars && typeof vars.count === "number") {
                const pluralSuffix = vars.count === 1 ? "_one" : "_other";
                const pluralValue = resolve(dictionary, key + pluralSuffix);
                if (pluralValue) {
                    return interpolate(pluralValue, vars);
                }
            }

            const value = resolve(dictionary, key);
            if (value === undefined) {
                if (process.env.NODE_ENV === "development") {
                    console.warn(`[i18n] Missing key: "${key}" (${locale})`);
                }
                return key;
            }

            return vars ? interpolate(value, vars) : value;
        },
        [dictionary, locale]
    );

    return { t, locale };
}
