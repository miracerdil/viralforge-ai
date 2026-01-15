'use client';

import { useState } from 'react';
import { Sparkles, Lock, Crown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { PlatformSelector } from '@/components/ui/platform-selector';
import { CategorySelector } from '@/components/category';
import { useCategories } from '@/hooks/use-categories';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Tone, Goal } from '@/lib/types/planner';
import { TONES, GOALS } from '@/lib/types/planner';
import type { Platform } from '@/lib/types/platform';
import { DEFAULT_PLATFORM } from '@/lib/types/platform';
import type { CategorySelection, CategoryGroupId } from '@/lib/types/category';
import { DEFAULT_CATEGORY } from '@/lib/types/category';

interface HookGeneratorProps {
  locale: string;
  dictionary: Dictionary;
  isPro: boolean;
  onGenerate: (platform: Platform, categoryGroup: CategoryGroupId, categorySlug: string, tone: Tone, goal: Goal) => Promise<void>;
  isLoading: boolean;
}

export function HookGenerator({
  locale,
  dictionary,
  isPro,
  onGenerate,
  isLoading,
}: HookGeneratorProps) {
  const t = dictionary.hooks;
  const { categories, loading: categoriesLoading } = useCategories();
  const [platform, setPlatform] = useState<Platform>(DEFAULT_PLATFORM);
  const [category, setCategory] = useState<CategorySelection>(DEFAULT_CATEGORY);
  const [tone, setTone] = useState<Tone>('funny');
  const [goal, setGoal] = useState<Goal>('views');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro) return;
    await onGenerate(platform, category.group, category.slug, tone, goal);
  };

  const toneLabels: Record<Tone, { tr: string; en: string }> = {
    funny: { tr: 'Eğlenceli', en: 'Funny' },
    serious: { tr: 'Ciddi', en: 'Serious' },
    educational: { tr: 'Eğitici', en: 'Educational' },
    controversial: { tr: 'Tartışmalı', en: 'Controversial' },
    inspirational: { tr: 'İlham Verici', en: 'Inspirational' },
  };

  const goalLabels: Record<Goal, { tr: string; en: string }> = {
    views: { tr: 'İzlenme', en: 'Views' },
    followers: { tr: 'Takipçi', en: 'Followers' },
    engagement: { tr: 'Etkileşim', en: 'Engagement' },
    sales: { tr: 'Satış', en: 'Sales' },
  };

  if (!isPro) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6">
          <Lock className="w-8 h-8 text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium text-center mb-4">{t.generateProOnly}</p>
          <Link href={`/${locale}/pricing`}>
            <Button variant="primary" className="gap-2">
              <Crown className="w-4 h-4" />
              {dictionary.common.upgrade}
            </Button>
          </Link>
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary-600" />
            {t.generateHooks}
          </CardTitle>
        </CardHeader>
        <CardContent className="blur-sm">
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary-600" />
          {t.generateHooks}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
          {/* Category */}
          {!categoriesLoading && categories.length > 0 && (
            <div className="min-w-0">
              <CategorySelector
                locale={locale}
                dictionary={dictionary}
                value={category}
                onChange={setCategory}
                categories={categories}
                disabled={isLoading}
                compact
              />
            </div>
          )}

          {/* Platform */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {dictionary.platforms.title}
            </label>
            <PlatformSelector
              value={platform}
              onChange={setPlatform}
              dictionary={dictionary}
              variant="dropdown"
              size="md"
            />
          </div>

          {/* Tone */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.selectTone}</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {toneLabels[t][locale as 'tr' | 'en']}
                </option>
              ))}
            </select>
          </div>

          {/* Goal */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.selectGoal}</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as Goal)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {goalLabels[g][locale as 'tr' | 'en']}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {t.generating}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {t.generateHooks}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
