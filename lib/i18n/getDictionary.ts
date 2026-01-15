import { locales, defaultLocale, type Locale } from './config';

const dictionaries = {
  tr: () => import('./dictionaries/tr.json').then((module) => module.default),
  en: () => import('./dictionaries/en.json').then((module) => module.default),
};

export async function getDictionary(locale: Locale | string) {
  // Fallback to default locale if invalid locale is provided
  const validLocale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  return dictionaries[validLocale]();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
