'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UploadForm } from '@/components/dashboard/upload-form';
import { AnalysisList } from '@/components/dashboard/analysis-list';
import { DailyMissionCard } from '@/components/missions/daily-mission';
import { PersonaCard } from '@/components/persona/persona-card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Analysis, Profile } from '@/lib/types/database';

export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [quotaReached, setQuotaReached] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserId(user.id);

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Load analyses
      const { data: analysesData } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (analysesData) {
        setAnalyses(analysesData);
      }

      // Check quota for free users
      const userPlan = ((profileData as Profile | null)?.plan || 'free').toLowerCase();
      if (userPlan === 'free') {
        const today = new Date().toISOString().split('T')[0];
        const { data: usageData } = await supabase
          .from('usage_daily')
          .select('analyses_count')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();

        const count = usageData?.analyses_count || 0;
        setTodayCount(count);
        setQuotaReached(count >= 1);
      }

      setLoading(false);
    };

    loadData();

    // Subscribe to analysis updates
    const channel = supabase
      .channel('analyses')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analyses',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAnalyses((prev) => [payload.new as Analysis, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAnalyses((prev) =>
              prev.map((a) => (a.id === payload.new.id ? (payload.new as Analysis) : a))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (loading || !dictionary || !userId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const t = dictionary;
  const today = new Date().toISOString().split('T')[0];
  const normalizedPlan = (profile?.plan || 'free').toLowerCase();
  const isPro: boolean =
    normalizedPlan.includes('pro') ||
    normalizedPlan === 'business' ||
    Boolean(profile?.comped_until && profile.comped_until >= today);

  // Plan display names
  const planDisplayName = normalizedPlan.includes('pro')
    ? 'PRO'
    : normalizedPlan === 'business'
      ? 'Business'
      : (locale === 'tr' ? 'Ücretsiz' : 'Free');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t.dashboard.title}</h1>
          <p className="text-gray-600 mt-1">
            {t.dashboard.welcome}, {profile?.name || profile?.email?.split('@')[0]}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">{t.dashboard.plan}</p>
            <Badge variant={isPro ? 'success' : 'default'}>
              {planDisplayName}
            </Badge>
          </div>
          {!isPro && (
            <div className="text-right">
              <p className="text-sm text-gray-500">{t.dashboard.analysesToday}</p>
              <p className="font-semibold text-gray-900">{todayCount} / 1</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Upload Form */}
        <div className="lg:col-span-2">
          <UploadForm
            dictionary={dictionary}
            locale={locale}
            userId={userId}
            quotaReached={quotaReached}
          />
        </div>

        {/* Right Column - Daily Mission & Persona */}
        <div className="lg:col-span-1 space-y-6">
          <DailyMissionCard
            locale={locale}
            dictionary={dictionary}
            isPro={isPro}
            niche="general"
          />
          <PersonaCard
            locale={locale}
            dictionary={dictionary}
            isPro={isPro}
          />
        </div>
      </div>

      {/* Full Width - Analysis List */}
      <div className="mt-8">
        <AnalysisList analyses={analyses} dictionary={dictionary} locale={locale} />
      </div>
    </div>
  );
}
