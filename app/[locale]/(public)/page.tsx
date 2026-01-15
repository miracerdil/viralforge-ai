import Link from 'next/link';
import { Brain, Zap, Target, Sparkles, ArrowRight, User, Building2 } from 'lucide-react';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Button } from '@/components/ui/button';
import { Hero } from '@/components/landing/Hero';
import { WorkflowSection } from '@/components/landing/WorkflowSection';
import type { Locale } from '@/lib/i18n/config';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as Locale);
  const t = dictionary;

  return (
    <>
      {/* New Hero Section */}
      <Hero locale={locale} />

      {/* New Workflow Section */}
      <WorkflowSection locale={locale} />

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {locale === 'tr' ? 'Neden ViralForge AI?' : 'Why ViralForge AI?'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {locale === 'tr'
                ? 'Sadece hook üretmiyoruz - içerik stratejini tamamen dönüştürüyoruz'
                : "We don't just generate hooks - we transform your entire content strategy"}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-primary-50 transition-colors">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.home.feature1Title}
              </h3>
              <p className="text-sm text-gray-600">{t.home.feature1Description}</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-accent-50 transition-colors">
              <div className="w-14 h-14 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-accent-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.home.feature2Title}
              </h3>
              <p className="text-sm text-gray-600">{t.home.feature2Description}</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-green-50 transition-colors">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.home.feature3Title}
              </h3>
              <p className="text-sm text-gray-600">{t.home.feature3Description}</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-amber-50 transition-colors">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.home.feature4Title}
              </h3>
              <p className="text-sm text-gray-600">{t.home.feature4Description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Creators & Businesses Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {t.home.builtFor}
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              {t.home.builtForDescription}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {/* For Creators */}
            <div className="relative bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 lg:p-8 border border-primary-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t.home.forCreators}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t.home.forCreatorsDescription}
              </p>
              <ul className="mt-4 space-y-2">
                {(locale === 'tr'
                  ? ['Kişiselleştirilmiş hook önerileri', 'Stil öğrenme', 'Trend analizi']
                  : ['Personalized hook suggestions', 'Style learning', 'Trend analysis']
                ).map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* For Businesses */}
            <div className="relative bg-gradient-to-br from-accent-50 to-amber-50 rounded-2xl p-6 lg:p-8 border border-accent-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t.home.forBusinesses}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t.home.forBusinessesDescription}
              </p>
              <ul className="mt-4 space-y-2">
                {(locale === 'tr'
                  ? ['Dönüşüm odaklı içerik', 'Yerel SEO optimizasyonu', 'Sosyal kanıt hook\'ları']
                  : ['Conversion-focused content', 'Local SEO optimization', 'Social proof hooks']
                ).map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            {locale === 'tr'
              ? 'Bugün İçerik Stratejini Dönüştür'
              : 'Transform Your Content Strategy Today'}
          </h2>
          <p className="text-primary-100 mb-8 text-base sm:text-lg max-w-2xl mx-auto">
            {locale === 'tr'
              ? 'Ücretsiz başla, sonuçları gör, sonra karar ver. Kredi kartı gerekmez.'
              : 'Start free, see results, then decide. No credit card required.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={`/${locale}/signup`}>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-primary-700 hover:bg-primary-50 px-8 min-h-[48px] text-base font-semibold shadow-lg"
              >
                <span className="mr-2">🚀</span>
                {locale === 'tr' ? 'Ücretsiz Başla' : 'Start Free'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href={`/${locale}/pricing`}>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/50 text-white hover:bg-white/10 min-h-[48px] text-base"
              >
                {locale === 'tr' ? 'Planları İncele' : 'View Plans'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
