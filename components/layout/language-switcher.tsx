'use client';

import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils/cn';

export function LanguageSwitcher() {
  const { locale, switchLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => switchLocale('tr')}
        className={cn(
          'px-3 py-1 text-sm font-medium rounded-md transition-colors',
          locale === 'tr'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        TR
      </button>
      <button
        onClick={() => switchLocale('en')}
        className={cn(
          'px-3 py-1 text-sm font-medium rounded-md transition-colors',
          locale === 'en'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        )}
      >
        EN
      </button>
    </div>
  );
}
