'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import type { Dictionary } from '@/lib/i18n/getDictionary';

export default function LoginPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  if (!dictionary) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <LoginForm dictionary={dictionary} locale={locale} />
    </div>
  );
}
