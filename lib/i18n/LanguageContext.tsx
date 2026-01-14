"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language, TranslationKey, languageNames, rtlLanguages } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  languageNames: typeof languageNames;
  availableLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split("-")[0] as Language;
      if (translations[browserLang]) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      // Save language preference
      localStorage.setItem("language", language);

      // Update document direction for RTL languages
      document.documentElement.dir = rtlLanguages.includes(language) ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
  }, [language, isClient]);

  const setLanguage = (lang: Language) => {
    if (translations[lang]) {
      setLanguageState(lang);
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  const isRTL = rtlLanguages.includes(language);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL,
    languageNames,
    availableLanguages: Object.keys(translations) as Language[],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Export a simple hook for getting translations without the full context
export function useTranslation() {
  const { t, language, isRTL } = useLanguage();
  return { t, language, isRTL };
}
