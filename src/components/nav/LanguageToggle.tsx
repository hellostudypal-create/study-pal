"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <button
      type="button"
      aria-label={t("nav.toggleLanguage")}
      onClick={() => setLocale(locale === "en" ? "si" : "en")}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground",
        className
      )}
    >
      {locale === "en" ? "සි" : "EN"}
    </button>
  );
}
