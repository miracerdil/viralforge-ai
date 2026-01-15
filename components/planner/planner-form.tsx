'use client';

import { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { PlatformSelector } from '@/components/ui/platform-selector';
import { ChipGroup } from '@/components/ui/chip-group';
import { CategorySelector } from '@/components/category';
import { useCategories } from '@/hooks/use-categories';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { PlannerFormData, Goal, Tone, Frequency } from '@/lib/types/planner';
import { GOALS, TONES, FREQUENCIES } from '@/lib/types/planner';
import type { Platform } from '@/lib/types/platform';
import { DEFAULT_PLATFORM } from '@/lib/types/platform';
import type { CategorySelection } from '@/lib/types/category';
import { DEFAULT_CATEGORY } from '@/lib/types/category';

interface PlannerFormProps {
  locale: string;
  dictionary: Dictionary;
  isPro: boolean;
  onGenerate: (data: PlannerFormData) => Promise<void>;
  isLoading: boolean;
}

export function PlannerForm({
  locale,
  dictionary,
  isPro,
  onGenerate,
  isLoading,
}: PlannerFormProps) {
  const t = dictionary.planner;
  const { categories, loading: categoriesLoading } = useCategories();
  const [category, setCategory] = useState<CategorySelection>(DEFAULT_CATEGORY);
  const [formData, setFormData] = useState<Omit<PlannerFormData, 'niche'> & { niche?: string }>({
    platform: DEFAULT_PLATFORM,
    goal: 'views',
    audience: '',
    tone: undefined,
    frequency: 7,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGenerate({
      ...formData,
      niche: category.slug as any,
      categoryGroup: category.group,
      categorySlug: category.slug,
    } as PlannerFormData);
  };

  const goalLabels: Record<Goal, { tr: string; en: string }> = {
    views: { tr: 'İzlenme', en: 'Views' },
    followers: { tr: 'Takipçi', en: 'Followers' },
    engagement: { tr: 'Etkileşim', en: 'Engagement' },
    sales: { tr: 'Satış', en: 'Sales' },
  };

  const toneLabels: Record<Tone, { tr: string; en: string }> = {
    funny: { tr: 'Eğlenceli', en: 'Funny' },
    serious: { tr: 'Ciddi', en: 'Serious' },
    educational: { tr: 'Eğitici', en: 'Educational' },
    controversial: { tr: 'Tartışmalı', en: 'Controversial' },
    inspirational: { tr: 'İlham Verici', en: 'Inspirational' },
  };

  const goalOptions = useMemo(() =>
    GOALS.map((goal) => ({
      value: goal,
      label: goalLabels[goal][locale as 'tr' | 'en'],
    })),
    [locale]
  );

  const toneOptions = useMemo(() =>
    TONES.map((tone) => ({
      value: tone,
      label: toneLabels[tone][locale as 'tr' | 'en'],
    })),
    [locale]
  );

  const frequencyOptions = useMemo(() =>
    FREQUENCIES.map((freq) => ({
      value: String(freq) as `${Frequency}`,
      label: `${freq} ${t.videosPerWeek}`,
    })),
    [t.videosPerWeek]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          {t.createPlan}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          {!categoriesLoading && categories.length > 0 && (
            <CategorySelector
              locale={locale}
              dictionary={dictionary}
              value={category}
              onChange={setCategory}
              categories={categories}
              disabled={isLoading}
            />
          )}

          {/* Platform Selection */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.platform || dictionary.platforms.title}
            </label>
            <PlatformSelector
              value={formData.platform}
              onChange={(platform) => setFormData({ ...formData, platform })}
              dictionary={dictionary}
              disabled={isLoading}
              variant="segmented"
            />
          </div>

          {/* Goal Selection */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.goal}</label>
            <ChipGroup
              options={goalOptions}
              value={formData.goal}
              onChange={(goal) => setFormData({ ...formData, goal })}
              disabled={isLoading}
            />
          </div>

          {/* Target Audience (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.audience} <span className="text-gray-400">({t.optional})</span>
            </label>
            <Input
              type="text"
              placeholder={t.audiencePlaceholder}
              value={formData.audience || ''}
              onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
            />
          </div>

          {/* Tone Selection (Optional) */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.tone} <span className="text-gray-400">({t.optional})</span>
            </label>
            <ChipGroup
              options={toneOptions}
              value={formData.tone}
              onChange={(tone) =>
                setFormData({
                  ...formData,
                  tone: formData.tone === tone ? undefined : tone,
                })
              }
              disabled={isLoading}
            />
          </div>

          {/* Frequency Selection */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.frequency}</label>
            <ChipGroup
              options={frequencyOptions}
              value={String(formData.frequency)}
              onChange={(freq) => setFormData({ ...formData, frequency: Number(freq) as Frequency })}
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {t.generating}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {t.generatePlan}
              </>
            )}
          </Button>

          {!isPro && (
            <p className="text-sm text-amber-600 text-center">
              {t.freeLimit}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
