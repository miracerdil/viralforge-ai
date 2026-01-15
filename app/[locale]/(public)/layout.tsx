import { getUser } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { PublicLayoutClient } from '@/components/layout/public-layout-client';
import type { Locale } from '@/lib/i18n/config';

interface PublicLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { locale } = await params;
  const [user, dictionary] = await Promise.all([
    getUser(),
    getDictionary(locale as Locale),
  ]);

  return (
    <PublicLayoutClient
      dictionary={dictionary}
      locale={locale}
      initialUser={user}
    >
      {children}
    </PublicLayoutClient>
  );
}
