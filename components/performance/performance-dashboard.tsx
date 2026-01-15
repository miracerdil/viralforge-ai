'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Eye,
  TrendingUp,
  Award,
  ArrowRight,
  Lock,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { PerformanceSummary } from '@/lib/types/performance';

interface PerformanceDashboardProps {
  locale: string;
  dictionary: Dictionary;
  isPro: boolean;
}

export function PerformanceDashboard({
  locale,
  dictionary,
  isPro,
}: PerformanceDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);

  const t = dictionary.performance || {
    title: 'Performance Tracking',
    subtitle: 'Track your content performance',
    totalGenerations: 'AI Generations',
    totalResults: 'Results Tracked',
    avgViews: 'Avg. Views',
    avgEngagement: 'Avg. Engagement',
    bestPlatform: 'Best Platform',
    bestTone: 'Best Tone',
    topPatterns: 'Top Performing Patterns',
    noData: 'No data yet',
    startTracking: 'Start tracking your results to get insights',
    proOnly: 'Performance tracking is a PRO feature',
    upgrade: 'Upgrade to PRO',
    viewAll: 'View All',
  };

  const platformLabels: Record<string, string> = {
    tiktok: 'TikTok',
    instagram_reels: 'Instagram Reels',
    instagram_post: 'Instagram Post',
    youtube_shorts: 'YouTube Shorts',
  };

  const toneLabels: Record<string, { tr: string; en: string }> = {
    funny: { tr: 'Eğlenceli', en: 'Funny' },
    serious: { tr: 'Ciddi', en: 'Serious' },
    educational: { tr: 'Eğitici', en: 'Educational' },
    controversial: { tr: 'Tartışmalı', en: 'Controversial' },
    inspirational: { tr: 'İlham Verici', en: 'Inspirational' },
  };

  useEffect(() => {
    if (!isPro) {
      setLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/performance/summary');
        if (response.ok) {
          const data = await response.json();
          setSummary(data.summary);
        }
      } catch (error) {
        console.error('Failed to fetch performance summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [isPro]);

  // Not PRO - show upgrade prompt
  if (!isPro) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6">
          <Lock className="w-8 h-8 text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium text-center mb-4">{t.proOnly}</p>
          <Link href={`/${locale}/pricing`}>
            <Button variant="primary" className="gap-2">
              <Crown className="w-4 h-4" />
              {t.upgrade}
            </Button>
          </Link>
        </div>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-green-600" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="blur-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-green-600" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = summary && summary.total_results > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-green-600" />
            {t.title}
          </div>
          {hasData && (
            <Link href={`/${locale}/performance`}>
              <Button variant="ghost" size="sm" className="text-sm">
                {t.viewAll}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-6">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">{t.noData}</p>
            <p className="text-sm text-gray-400">{t.startTracking}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total Generations */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">{t.totalGenerations}</p>
                <p className="text-2xl font-bold text-blue-700">
                  {summary.total_generations.toLocaleString()}
                </p>
              </div>

              {/* Total Results */}
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 mb-1">{t.totalResults}</p>
                <p className="text-2xl font-bold text-green-700">
                  {summary.total_results.toLocaleString()}
                </p>
              </div>

              {/* Avg Views */}
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
                  <Eye className="w-3 h-3" />
                  {t.avgViews}
                </div>
                <p className="text-2xl font-bold text-purple-700">
                  {Math.round(summary.avg_views).toLocaleString()}
                </p>
              </div>

              {/* Avg Engagement */}
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-1 text-xs text-amber-600 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  {t.avgEngagement}
                </div>
                <p className="text-2xl font-bold text-amber-700">
                  {summary.avg_engagement_rate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Best Performers */}
            {(summary.best_platform || summary.best_tone) && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {t.topPatterns}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.best_platform && (
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                      {t.bestPlatform}: {platformLabels[summary.best_platform]}
                    </span>
                  )}
                  {summary.best_tone && (
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                      {t.bestTone}: {toneLabels[summary.best_tone]?.[locale as 'tr' | 'en'] || summary.best_tone}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
