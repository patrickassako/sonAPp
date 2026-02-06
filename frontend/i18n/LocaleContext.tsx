"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Locale } from "./types";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./types";
import { getDictionary } from "./dictionaries";

interface LocaleContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    dictionary: Record<string, any>;
    isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextValue>({
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    dictionary: {},
    isLoading: true,
});

function getInitialLocale(): Locale {
    if (typeof window === "undefined") return DEFAULT_LOCALE;

    // 1. Check localStorage
    const stored = localStorage.getItem("bimzik-locale");
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
        return stored as Locale;
    }

    // 2. Check navigator language
    const browserLang = navigator.language?.split("-")[0];
    if (browserLang && SUPPORTED_LOCALES.includes(browserLang as Locale)) {
        return browserLang as Locale;
    }

    // 3. Default
    return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
    const [dictionary, setDictionary] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("bimzik-locale", newLocale);
        document.documentElement.lang = newLocale;
    }, []);

    // Load initial locale on mount
    useEffect(() => {
        const initial = getInitialLocale();
        setLocaleState(initial);
        document.documentElement.lang = initial;
    }, []);

    // Load dictionary when locale changes
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);

        getDictionary(locale).then((dict) => {
            if (!cancelled) {
                setDictionary(dict);
                setIsLoading(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [locale]);

    return (
        <LocaleContext.Provider value={{ locale, setLocale, dictionary, isLoading }}>
            {children}
        </LocaleContext.Provider>
    );
}

export function useLocale() {
    return useContext(LocaleContext);
}
