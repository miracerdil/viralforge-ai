'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PlatformSelector } from '@/components/ui/platform-selector';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Niche, Tone } from '@/lib/types/planner';
import { NICHES, TONES } from '@/lib/types/planner';
import type { Platform } from '@/lib/types/platform';

interface HookFiltersProps {
  locale: string;
  dictionary: Dictionary;
  selectedPlatform: Platform | null;
  selectedNiche: Niche | null;
  selectedTone: Tone | null;
  searchQuery: string;
  onPlatformChange: (platform: Platform | null) => void;
  onNicheChange: (niche: Niche | null) => void;
  onToneChange: (tone: Tone | null) => void;
  onSearchChange: (query: string) => void;
}

export function HookFilters({
  locale,
  dictionary,
  selectedPlatform,
  selectedNiche,
  selectedTone,
  searchQuery,
  onPlatformChange,
  onNicheChange,
  onToneChange,
  onSearchChange,
}: HookFiltersProps) {
  const t = dictionary.hooks;

  const nicheLabels: Record<Niche, { tr: string; en: string }> = {
    fitness: { tr: 'Fitness', en: 'Fitness' },
    beauty: { tr: 'Güzellik', en: 'Beauty' },
    ecommerce: { tr: 'E-ticaret', en: 'E-commerce' },
    education: { tr: 'Eğitim', en: 'Education' },
    motivation: { tr: 'Motivasyon', en: 'Motivation' },
    food: { tr: 'Yemek', en: 'Food' },
    travel: { tr: 'Seyahat', en: 'Travel' },
    gaming: { tr: 'Oyun', en: 'Gaming' },
    general: { tr: 'Genel', en: 'General' },
  };

  const toneLabels: Record<Tone, { tr: string; en: string }> = {
    funny: { tr: 'Eğlenceli', en: 'Funny' },
    serious: { tr: 'Ciddi', en: 'Serious' },
    educational: { tr: 'Eğitici', en: 'Educational' },
    controversial: { tr: 'Tartışmalı', en: 'Controversial' },
    inspirational: { tr: 'İlham Verici', en: 'Inspirational' },
  };

  return (
    <div className="space-y-4 bg-white rounded-lg border border-gray-200 p-4 min-w-0 w-full overflow-x-hidden md:overflow-visible">
      {/* Search */}
      <div className="relative min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Platform Filter */}
      <div className="min-w-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.filterByPlatform}</label>
        <PlatformSelector
          value={selectedPlatform || 'tiktok'}
          onChange={(p) => onPlatformChange(p)}
          dictionary={dictionary}
          variant="segmented"
          size="sm"
        />
        {selectedPlatform && (
          <button
            onClick={() => onPlatformChange(null)}
            className="mt-2 text-xs text-primary-600 hover:underline"
          >
            {t.all}
          </button>
        )}
      </div>

      {/* Niche Filter */}
      <div className="min-w-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.filterByNiche}</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNicheChange(null)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors max-w-full truncate shrink-0 ${
              selectedNiche === null
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
            }`}
          >
            {t.all}
          </button>
          {NICHES.map((niche) => (
            <button
              key={niche}
              onClick={() => onNicheChange(niche)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors max-w-full truncate shrink-0 ${
                selectedNiche === niche
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
              }`}
            >
              {nicheLabels[niche][locale as 'tr' | 'en']}
            </button>
          ))}
        </div>
      </div>

      {/* Tone Filter */}
      <div className="min-w-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.filterByTone}</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onToneChange(null)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors max-w-full truncate shrink-0 ${
              selectedTone === null
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
            }`}
          >
            {t.all}
          </button>
          {TONES.map((tone) => (
            <button
              key={tone}
              onClick={() => onToneChange(tone)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors max-w-full truncate shrink-0 ${
                selectedTone === tone
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
              }`}
            >
              {toneLabels[tone][locale as 'tr' | 'en']}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
