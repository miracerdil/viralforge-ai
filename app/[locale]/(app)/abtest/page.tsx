'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ABTestForm } from '@/components/abtest/abtest-form';
import { Spinner } from '@/components/ui/spinner';
import type { Dictionary } from '@/lib/i18n/getDictionary';

export default function ABTestPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  if (!dictionary) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ABTestForm dictionary={dictionary} locale={locale} />
    </div>
  );
}
