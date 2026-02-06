import type { Locale } from "./types";

const dictionaries: Record<Locale, () => Promise<Record<string, any>>> = {
    fr: () => import("@/messages/fr.json").then((m) => m.default),
    en: () => import("@/messages/en.json").then((m) => m.default),
};

export function getDictionary(locale: Locale) {
    return dictionaries[locale]();
}
