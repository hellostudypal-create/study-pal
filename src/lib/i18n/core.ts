import { en } from "./dictionaries/en";
import { si } from "./dictionaries/si";

export type Locale = "en" | "si";
export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

export const LOCALE_COOKIE = "locale";

const dictionaries = { en, si };

function lookup(locale: Locale, key: string): string {
  const parts = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = dictionaries[locale];
  for (const part of parts) {
    node = node?.[part];
  }
  if (typeof node !== "string") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing key "${key}" for locale "${locale}"`);
    }
    return key;
  }
  return node;
}

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const raw = lookup(locale, key);
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ""));
}
