"use client";

import { useLanguage } from "@/context/LanguageContext";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      id="language-toggle"
      onClick={toggleLanguage}
      aria-label={`Switch to ${language === "en" ? "Chinese" : "English"}`}
      className="relative flex h-9 items-center gap-1 rounded-lg border border-border
        bg-surface px-3 text-sm font-medium hover:bg-surface-elevated
        hover:border-accent/40 cursor-pointer transition-all duration-200"
    >
      <span
        className={`transition-all duration-200 ${
          language === "en"
            ? "text-accent font-semibold"
            : "text-muted"
        }`}
      >
        EN
      </span>
      <span className="text-border">/</span>
      <span
        className={`transition-all duration-200 ${
          language === "zh"
            ? "text-accent font-semibold"
            : "text-muted"
        }`}
      >
        中
      </span>
    </button>
  );
}
