import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/getDictionary';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);

  return {
    title: {
      default: dictionary.common.appName,
      template: `%s | ${dictionary.common.appName}`,
    },
    description:
      locale === 'tr'
        ? 'TikTok videolarınızı AI destekli analiz ile viral yapın'
        : 'Make your TikTok videos go viral with AI-powered analysis',
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return <>{children}</>;
}
