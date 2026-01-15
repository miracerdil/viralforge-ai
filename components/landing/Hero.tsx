import Link from 'next/link';
import { ArrowRight, Play, Sparkles, Brain, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroProps {
  locale: string;
}

export function Hero({ locale }: HeroProps) {
  const content = {
    tr: {
      headline: 'AI Destekli İçerik Büyüme Motoru',
      subheadline: 'Üret • Test Et • Sonuca Göre Optimize Et • Daha Hızlı Büyü',
      description:
        'ViralForge AI, içerik stilini öğrenir, hangi formatın çalıştığını analiz eder ve bir sonraki içeriğini performansa göre optimize eder.',
      platforms: 'TikTok • Instagram Reels • YouTube Shorts • Instagram Post',
      primaryCta: 'İlk Viral Hook\'unu Üret',
      secondaryCta: '60 Saniyede Nasıl Çalıştığını Gör',
      socialProof: 'Türkiye\'de yüzlerce içerik üretici tarafından test ediliyor',
      badges: {
        autoOptimize: 'Otomatik Optimizasyon',
        personaLearning: 'Kişiselleştirme',
        abTesting: 'A/B Test',
      },
    },
    en: {
      headline: 'AI-Powered Content Growth Engine',
      subheadline: 'Create • Test • Optimize Based on Results • Grow Faster',
      description:
        'ViralForge AI learns your content style, analyzes what format works, and optimizes your next content based on performance.',
      platforms: 'TikTok • Instagram Reels • YouTube Shorts • Instagram Post',
      primaryCta: 'Generate Your First Viral Hook',
      secondaryCta: 'See How It Works in 60 Seconds',
      socialProof: 'Tested by hundreds of content creators in Turkey',
      badges: {
        autoOptimize: 'Auto Optimization',
        personaLearning: 'Persona Learning',
        abTesting: 'A/B Testing',
      },
    },
  };

  const t = content[locale as 'tr' | 'en'] || content.tr;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600">
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      {/* Gradient orbs for visual interest */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-tight">
              {t.headline}
            </h1>

            {/* Subheadline */}
            <p className="mt-4 text-lg sm:text-xl font-semibold text-white/90">
              {t.subheadline}
            </p>

            {/* Description */}
            <p className="mt-4 text-base sm:text-lg text-primary-100 max-w-xl mx-auto lg:mx-0">
              {t.description}
            </p>

            {/* Platform line */}
            <p className="mt-4 text-sm font-medium text-white/70">
              {t.platforms}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href={`/${locale}/signup`}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-primary-700 hover:bg-primary-50 px-8 min-h-[48px] text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <span className="mr-2">🚀</span>
                  {t.primaryCta}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white/50 text-white hover:bg-white/10 min-h-[48px] text-base backdrop-blur-sm"
                >
                  <Play className="mr-2 w-4 h-4" />
                  {t.secondaryCta}
                </Button>
              </a>
            </div>

            {/* Social proof */}
            <p className="mt-6 text-sm text-white/60 flex items-center justify-center lg:justify-start gap-2">
              <span className="flex -space-x-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-300 to-accent-300 border-2 border-white/20" />
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-300 to-primary-300 border-2 border-white/20" />
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 border-2 border-white/20" />
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-400 to-primary-400 border-2 border-white/20" />
              </span>
              {t.socialProof}
            </p>
          </div>

          {/* Right Column - Product Mockup */}
          <div className="relative">
            {/* Main mockup card */}
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl">
              {/* Mockup header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-white/50">ViralForge AI Dashboard</span>
              </div>

              {/* Dashboard preview placeholder */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">87</p>
                    <p className="text-xs text-white/60">Hook Score</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">+24%</p>
                    <p className="text-xs text-white/60">Engagement</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-accent-300">A</p>
                    <p className="text-xs text-white/60">Winner</p>
                  </div>
                </div>

                {/* Hook preview */}
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/50 mb-1">Generated Hook:</p>
                  <p className="text-sm text-white font-medium">
                    "Bu 3 saniyede dikkatini çekemezsem..."
                  </p>
                </div>

                {/* Action buttons placeholder */}
                <div className="flex gap-2">
                  <div className="flex-1 h-8 bg-primary-500/50 rounded-lg" />
                  <div className="flex-1 h-8 bg-white/10 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-white rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
              {t.badges.autoOptimize}
            </div>

            <div className="absolute top-1/4 -left-4 bg-white rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <Brain className="w-3.5 h-3.5 text-accent-500" />
              {t.badges.personaLearning}
            </div>

            <div className="absolute -bottom-4 left-1/4 bg-white rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <GitCompare className="w-3.5 h-3.5 text-green-500" />
              {t.badges.abTesting}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
