'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarDays, Crown } from 'lucide-react';
import { ExportButton } from '@/components/export';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PlannerForm } from '@/components/planner/planner-form';
import { PlanCard } from '@/components/planner/plan-card';
import { PlanHistory } from '@/components/planner/plan-history';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { WeeklyPlan, PlannerFormData, PlanItem } from '@/lib/types/planner';

export default function PlannerPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const supabase = createClient();

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<WeeklyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      // Check if user is Pro
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, comped_until')
        .eq('id', user.id)
        .single();

      if (profile) {
        const today = new Date().toISOString().split('T')[0];
        const normalizedPlan = (profile.plan || 'free').toLowerCase();
        setIsPro(normalizedPlan.includes('pro') || normalizedPlan === 'business' || (profile.comped_until && profile.comped_until >= today));
      }

      setLoading(false);
    };

    checkAuth();
  }, [locale, router, supabase]);

  const handleGenerate = async (data: PlannerFormData) => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          locale,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'weekly_limit_reached') {
          setError(result.message);
        } else {
          setError(dictionary?.planner.errorGenerating || 'Failed to generate plan');
        }
        return;
      }

      setCurrentPlan(result.plan);
    } catch (err) {
      console.error('Generate error:', err);
      setError(dictionary?.planner.errorGenerating || 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectPlan = (plan: WeeklyPlan) => {
    setCurrentPlan(plan);
  };

  if (loading || !dictionary) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const t = dictionary.planner;
  const planItems: PlanItem[] = currentPlan?.plan_json || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-gray-500">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton type="planners" locale={locale} />
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-1 space-y-6">
              <PlannerForm
                locale={locale}
                dictionary={dictionary}
                isPro={isPro}
                onGenerate={handleGenerate}
                isLoading={generating}
              />

              <PlanHistory
                locale={locale}
                dictionary={dictionary}
                onSelectPlan={handleSelectPlan}
              />
            </div>

            {/* Right Column - Results */}
            <div className="lg:col-span-2">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{error}</p>
                  {error.includes('limit') && (
                    <Link href={`/${locale}/pricing`}>
                      <Button variant="primary" size="sm" className="mt-2">
                        <Crown className="w-4 h-4 mr-2" />
                        {dictionary.common.upgrade}
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {generating && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Spinner size="lg" />
                  <p className="mt-4 text-gray-600">{t.generating}</p>
                  <p className="text-sm text-gray-400">{t.generatingHint}</p>
                </div>
              )}

              {!generating && !currentPlan && (
                <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                  <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t.noplanYet}</p>
                  <p className="text-sm text-gray-400">{t.createFirst}</p>
                </div>
              )}

              {!generating && currentPlan && planItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">{t.yourPlan}</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPlan(null)}
                    >
                      {t.newPlan}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {planItems.map((item, index) => (
                      <PlanCard
                        key={item.day_index}
                        item={item}
                        locale={locale}
                        dictionary={dictionary}
                        isLocked={!isPro && index >= 2}
                      />
                    ))}
                  </div>

                  {!isPro && planItems.length > 2 && (
                    <div className="text-center py-6 bg-gradient-to-t from-white to-transparent">
                      <Link href={`/${locale}/pricing`}>
                        <Button variant="primary" className="gap-2">
                          <Crown className="w-4 h-4" />
                          {t.unlockAll}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
    </div>
  );
}
