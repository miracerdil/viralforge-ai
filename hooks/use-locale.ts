'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import { locales, defaultLocale } from '@/lib/i18n/config';

const LOCALE_STORAGE_KEY = 'viralforge-locale';

export function useLocale() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Extract current locale from pathname
  const currentLocale = (pathname.split('/')[1] as Locale) || defaultLocale;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Save locale preference to localStorage
  useEffect(() => {
    if (mounted && locales.includes(currentLocale)) {
      localStorage.setItem(LOCALE_STORAGE_KEY, currentLocale);
    }
  }, [currentLocale, mounted]);

  const switchLocale = useCallback(
    (newLocale: Locale) => {
      if (!locales.includes(newLocale)) return;

      // Replace the locale segment in the pathname
      const segments = pathname.split('/');
      segments[1] = newLocale;
      const newPath = segments.join('/');

      router.push(newPath);
    },
    [pathname, router]
  );

  return {
    locale: currentLocale,
    locales,
    switchLocale,
    isCurrentLocale: (locale: Locale) => locale === currentLocale,
  };
}

export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale;
  }
  return null;
}
