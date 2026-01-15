'use client';

import { useState, useEffect } from 'react';
import { User, Sparkles, Crown, TrendingUp, Zap, MessageSquare, Timer } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { CreatorPersonaProfile } from '@/lib/types/persona';
import { getPersonaSummary, getDominantTone, getDominantOpening } from '@/lib/types/persona';

interface PersonaCardProps {
  locale: string;
  dictionary: Dictionary;
  isPro: boolean;
}

const TONE_ICONS: Record<string, string> = {
  funny: '😄',
  serious: '🎯',
  educational: '📚',
  controversial: '🔥',
  inspirational: '✨',
};

const TONE_COLORS: Record<string, string> = {
  funny: 'bg-yellow-100 text-yellow-700',
  serious: 'bg-blue-100 text-blue-700',
  educational: 'bg-green-100 text-green-700',
  controversial: 'bg-red-100 text-red-700',
  inspirational: 'bg-purple-100 text-purple-700',
};

const OPENING_LABELS: Record<string, { tr: string; en: string }> = {
  question: { tr: 'Soru', en: 'Question' },
  statement: { tr: 'İfade', en: 'Statement' },
  statistic: { tr: 'İstatistik', en: 'Statistic' },
  story: { tr: 'Hikaye', en: 'Story' },
  challenge: { tr: 'Meydan Okuma', en: 'Challenge' },
};

const CTA_LABELS: Record<string, { tr: string; en: string }> = {
  soft: { tr: 'Yumuşak', en: 'Soft' },
  direct: { tr: 'Direkt', en: 'Direct' },
  urgent: { tr: 'Acil', en: 'Urgent' },
  question: { tr: 'Soru', en: 'Question' },
};

const PACING_LABELS: Record<string, { tr: string; en: string }> = {
  fast: { tr: 'Hızlı', en: 'Fast' },
  medium: { tr: 'Orta', en: 'Medium' },
  slow: { tr: 'Yavaş', en: 'Slow' },
};

export function PersonaCard({ locale, dictionary, isPro }: PersonaCardProps) {
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState<CreatorPersonaProfile | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Use dictionary translations with fallback
  const t = (dictionary as any).persona || {
    title: locale === 'tr' ? 'İçerik Stilin' : 'Your Content Style',
    subtitle: locale === 'tr' ? 'AI kişiselleştirme profili' : 'AI personalization profile',
    dominantTone: locale === 'tr' ? 'Baskın Ton' : 'Dominant Tone',
    openingStyle: locale === 'tr' ? 'Açılış Stili' : 'Opening Style',
    ctaStyle: locale === 'tr' ? 'CTA Stili' : 'CTA Style',
    pacing: locale === 'tr' ? 'Tempo' : 'Pacing',
    hookLength: locale === 'tr' ? 'Hook Uzunluğu' : 'Hook Length',
    topTopics: locale === 'tr' ? 'En İyi Konular' : 'Top Topics',
    words: locale === 'tr' ? 'kelime' : 'words',
    noPersona: locale === 'tr' ? 'Henüz yeterli veri yok' : 'Not enough data yet',
    noPersonaDesc: locale === 'tr'
      ? 'İçerik ürettikçe AI stilinizi öğrenecek'
      : 'AI will learn your style as you create content',
    proOnly: locale === 'tr'
      ? 'Kişiselleştirme Pro özelliğidir'
      : 'Personalization is a Pro feature',
    proOnlyDesc: locale === 'tr'
      ? 'Pro\'ya geçerek AI\'ın stilinizi öğrenmesini sağlayın'
      : 'Upgrade to Pro to let AI learn your style',
    upgrade: locale === 'tr' ? 'Pro\'ya Geç' : 'Upgrade to Pro',
    contentGenerated: locale === 'tr' ? 'içerik üretildi' : 'content generated',
    tones: {},
    openings: {},
    ctas: {},
    pacings: {},
  };

  const fetchPersona = async () => {
    try {
      const response = await fetch('/api/persona');
      if (response.ok) {
        const data = await response.json();
        setPersona(data.persona);
      }
    } catch (error) {
      console.error('Fetch persona error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPro) {
      fetchPersona();
    } else {
      setLoading(false);
    }
  }, [isPro]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  // Free user - show upgrade prompt
  if (!isPro) {
    return (
      <>
        <Card className="border-dashed border-2 border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t.title}</h3>
                <p className="text-xs text-gray-500">{t.subtitle}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-3">
                <Crown className="w-8 h-8 text-primary-500" />
              </div>
              <p className="font-medium text-gray-900 mb-1">{t.proOnly}</p>
              <p className="text-sm text-gray-500 mb-4">{t.proOnlyDesc}</p>
              <Button onClick={() => setShowUpgradeModal(true)} size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                {t.upgrade}
              </Button>
            </div>
          </CardContent>
        </Card>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          dictionary={dictionary}
          locale={locale}
          feature="persona"
        />
      </>
    );
  }

  // No persona data yet
  if (!persona || persona.total_generations < 5) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t.title}</h3>
              <p className="text-xs text-gray-500">{t.subtitle}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-medium text-gray-700 mb-1">{t.noPersona}</p>
            <p className="text-sm text-gray-500">{t.noPersonaDesc}</p>
            {persona && (
              <p className="text-xs text-gray-400 mt-2">
                {persona.total_generations} / 5 {t.contentGenerated}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has persona data - show summary
  const dominantTone = getDominantTone(persona.tone_weights);
  const preferredOpening = getDominantOpening(persona.opening_bias);
  const toneColor = dominantTone ? TONE_COLORS[dominantTone] : 'bg-gray-100 text-gray-700';
  const toneIcon = dominantTone ? TONE_ICONS[dominantTone] : '🎨';

  return (
    <Card className="border-primary-100 bg-gradient-to-br from-primary-50/30 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t.title}</h3>
              <p className="text-xs text-gray-500">{t.subtitle}</p>
            </div>
          </div>
          <Badge variant="success" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Dominant Tone - Highlighted */}
          {dominantTone && (
            <div className={`p-3 rounded-lg ${toneColor}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{toneIcon}</span>
                <div>
                  <p className="text-xs opacity-75">{t.dominantTone}</p>
                  <p className="font-semibold capitalize">{dominantTone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Style Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Opening Style */}
            {preferredOpening && (
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                  <MessageSquare className="w-3 h-3" />
                  <span className="text-xs">{t.openingStyle}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {OPENING_LABELS[preferredOpening]?.[locale as 'tr' | 'en'] || preferredOpening}
                </p>
              </div>
            )}

            {/* CTA Style */}
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Zap className="w-3 h-3" />
                <span className="text-xs">{t.ctaStyle}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {CTA_LABELS[persona.cta_style]?.[locale as 'tr' | 'en'] || persona.cta_style}
              </p>
            </div>

            {/* Pacing */}
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <Timer className="w-3 h-3" />
                <span className="text-xs">{t.pacing}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {PACING_LABELS[persona.pacing]?.[locale as 'tr' | 'en'] || persona.pacing}
              </p>
            </div>

            {/* Hook Length */}
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs">{t.hookLength}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                ~{persona.avg_hook_length} {t.words}
              </p>
            </div>
          </div>

          {/* Best Performing Formats */}
          {persona.best_performing_format && (
            <div>
              <p className="text-xs text-gray-500 mb-2">{t.topTopics}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="default" className="text-xs">
                  {persona.best_performing_format}
                </Badge>
                {persona.best_performing_tone && (
                  <Badge variant="default" className="text-xs">
                    {persona.best_performing_tone}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Generation Count */}
          <div className="pt-2 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              {persona.total_generations} {t.contentGenerated}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
