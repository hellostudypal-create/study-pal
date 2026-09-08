import { cookies } from "next/headers";
import { translate, LOCALE_COOKIE, type Locale, type TFunction } from "./core";

export type { Locale, TFunction };
export { translate, LOCALE_COOKIE };

/** Server-only: read the persisted locale cookie, defaulting to English. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "si" ? "si" : "en";
}

/** Server-only: bound translate() for use in Server Components. */
export async function getT(): Promise<TFunction> {
  const locale = await getLocale();
  return (key, vars) => translate(locale, key, vars);
}
