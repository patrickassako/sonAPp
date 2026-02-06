"use client";

import { useLocale } from "@/i18n/LocaleContext";

export function LanguageSwitcher() {
    const { locale, setLocale } = useLocale();

    return (
        <button
            onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium text-white/70 hover:text-white"
            aria-label="Switch language"
        >
            {locale === "fr" ? (
                <>
                    <span className="text-base leading-none">🇬🇧</span>
                    <span className="hidden sm:inline">EN</span>
                </>
            ) : (
                <>
                    <span className="text-base leading-none">🇫🇷</span>
                    <span className="hidden sm:inline">FR</span>
                </>
            )}
        </button>
    );
}
