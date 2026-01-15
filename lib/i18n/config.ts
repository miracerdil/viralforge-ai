export const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'tr';

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
