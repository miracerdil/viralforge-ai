'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Lightbulb, Crown, Heart, Lock, Download } from 'lucide-react';
import { ExportButton } from '@/components/export';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { HookFilters } from '@/components/hooks/hook-filters';
import { HookCard } from '@/components/hooks/hook-card';
import { HookGenerator } from '@/components/hooks/hook-generator';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { HookWithFavorite } from '@/lib/types/hooks';
import type { Tone, Goal, Niche } from '@/lib/types/planner';
import type { CategoryGroupId } from '@/lib/types/category';
import { FREE_HOOKS_LIMIT, FREE_FAVORITES_LIMIT } from '@/lib/types/hooks';
import type { Platform } from '@/lib/types/platform';

type TabType = 'library' | 'favorites';

export default function HooksPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const supabase = createClient();

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [hasPremiumHooks, setHasPremiumHooks] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('library');

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [selectedTone, setSelectedTone] = useState<Tone | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Data
  const [hooks, setHooks] = useState<HookWithFavorite[]>([]);
  const [favorites, setFavorites] = useState<HookWithFavorite[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isLimited, setIsLimited] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      // Check if user is Pro or has premium hooks access
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, comped_until, premium_hooks_until')
        .eq('id', user.id)
        .single();

      if (profile) {
        const today = new Date().toISOString().split('T')[0];
        const normalizedPlan = (profile.plan || 'free').toLowerCase();
        setIsPro(normalizedPlan.includes('pro') || normalizedPlan === 'business' || (profile.comped_until && profile.comped_until >= today));

        // Check for premium hooks from reward shop (24h pass)
        const premiumHooksActive = profile.premium_hooks_until
          ? new Date(profile.premium_hooks_until) > new Date()
          : false;
        setHasPremiumHooks(premiumHooksActive);
      }

      setLoading(false);
    };

    checkAuth();
  }, [locale, router, supabase]);

  const fetchHooks = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('locale', locale);
    if (selectedPlatform) params.set('platform', selectedPlatform);
    if (selectedNiche) params.set('niche', selectedNiche);
    if (selectedTone) params.set('tone', selectedTone);
    if (searchQuery) params.set('q', searchQuery);

    const response = await fetch(`/api/hooks?${params}`);
    if (response.ok) {
      const data = await response.json();
      setHooks(data.hooks);
      setIsLimited(data.is_limited);
    }
  }, [locale, selectedPlatform, selectedNiche, selectedTone, searchQuery]);

  const fetchFavorites = useCallback(async () => {
    const response = await fetch(`/api/hooks/favorites?locale=${locale}`);
    if (response.ok) {
      const data = await response.json();
      setFavorites(data.favorites);
      setFavoritesCount(data.total);
    }
  }, [locale]);

  useEffect(() => {
    if (!loading) {
      fetchHooks();
      fetchFavorites();
    }
  }, [loading, fetchHooks, fetchFavorites]);

  const handleToggleFavorite = async (hookId: string, isFavorite: boolean) => {
    // Check limit for FREE users
    if (!isPro && !isFavorite && favoritesCount >= FREE_FAVORITES_LIMIT) {
      alert(dictionary?.hooks.favoritesLimitReached || 'Favorites limit reached');
      return;
    }

    const method = isFavorite ? 'DELETE' : 'POST';
    const response = await fetch('/api/hooks/favorite', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hook_id: hookId }),
    });

    if (response.ok) {
      // Update local state
      setHooks((prev) =>
        prev.map((h) => (h.id === hookId ? { ...h, is_favorite: !isFavorite } : h))
      );
      setFavorites((prev) =>
        isFavorite ? prev.filter((h) => h.id !== hookId) : prev
      );
      setFavoritesCount((prev) => (isFavorite ? prev - 1 : prev + 1));

      // Refresh favorites if on favorites tab
      if (!isFavorite) {
        fetchFavorites();
      }
    }
  };

  const handleGenerateHooks = async (platform: Platform, categoryGroup: CategoryGroupId, categorySlug: string, tone: Tone, goal: Goal) => {
    setGenerating(true);
    try {
      const response = await fetch('/api/hooks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, categoryGroup, categorySlug, tone, goal, locale }),
      });

      if (response.ok) {
        // Refresh hooks list
        await fetchHooks();
      }
    } catch (error) {
      console.error('Generate hooks error:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !dictionary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const t = dictionary.hooks;
  const displayHooks = activeTab === 'library' ? hooks : favorites;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-gray-500">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton type="hooks" locale={locale} />
              {!isPro && (
                <Link href={`/${locale}/pricing`}>
                  <Button variant="outline" className="gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    {dictionary.common.upgrade}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <HookFilters
                locale={locale}
                dictionary={dictionary}
                selectedPlatform={selectedPlatform}
                selectedNiche={selectedNiche}
                selectedTone={selectedTone}
                searchQuery={searchQuery}
                onPlatformChange={setSelectedPlatform}
                onNicheChange={setSelectedNiche}
                onToneChange={setSelectedTone}
                onSearchChange={setSearchQuery}
              />

              <HookGenerator
                locale={locale}
                dictionary={dictionary}
                isPro={isPro || hasPremiumHooks}
                onGenerate={handleGenerateHooks}
                isLoading={generating}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Tabs */}
              <div className="flex items-center gap-4 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('library')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'library'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 inline mr-2" />
                  {t.library}
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'favorites'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Heart className="w-4 h-4 inline mr-2" />
                  {t.favorites} ({favoritesCount})
                </button>
              </div>

              {/* Limit Warning */}
              {isLimited && activeTab === 'library' && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-amber-600" />
                    <p className="text-amber-700">{t.limitedAccess}</p>
                  </div>
                  <Link href={`/${locale}/pricing`}>
                    <Button variant="primary" size="sm" className="gap-2">
                      <Crown className="w-4 h-4" />
                      {t.unlockAll}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Free Favorites Limit Warning */}
              {!isPro && activeTab === 'favorites' && favoritesCount >= FREE_FAVORITES_LIMIT && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <p className="text-amber-700">
                    {t.favoritesLimit.replace('{limit}', FREE_FAVORITES_LIMIT.toString())}
                  </p>
                  <Link href={`/${locale}/pricing`}>
                    <Button variant="primary" size="sm" className="gap-2">
                      <Crown className="w-4 h-4" />
                      {dictionary.common.upgrade}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Hooks List */}
              {displayHooks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                  {activeTab === 'library' ? (
                    <>
                      <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">{t.noHooksFound}</p>
                    </>
                  ) : (
                    <>
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">{t.noFavorites}</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {displayHooks.map((hook) => (
                    <HookCard
                      key={hook.id}
                      hook={hook}
                      locale={locale}
                      dictionary={dictionary}
                      onToggleFavorite={handleToggleFavorite}
                      disabled={!isPro && !hook.is_favorite && favoritesCount >= FREE_FAVORITES_LIMIT}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
    </div>
  );
}
