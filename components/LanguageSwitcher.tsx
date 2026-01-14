"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { language, setLanguage, languageNames, availableLanguages } = useLanguage();

  return (
    <div className="relative group">
      <Button variant="outline" size="sm" className="min-w-[80px]">
        {languageNames[language]}
      </Button>
      <div className="absolute right-0 mt-1 w-32 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {availableLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
              language === lang ? "bg-green-50 text-green-700 font-medium" : ""
            }`}
          >
            {languageNames[lang]}
          </button>
        ))}
      </div>
    </div>
  );
}
