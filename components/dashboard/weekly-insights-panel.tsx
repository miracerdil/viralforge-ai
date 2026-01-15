'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Eye, Heart, BarChart3, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InsightsSummary } from '@/lib/types/insights';

interface WeeklyInsightsPanelProps {
  locale: string;
}

export function WeeklyInsightsPanel({ locale }: WeeklyInsightsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<InsightsSummary | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [minimumResults, setMinimumResults] = useState(0);
  const [currentResults, setCurrentResults] = useState(0);

  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/insights/summary?locale=${locale}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setIsPro(data.isPro);
        setHasData(data.hasData);
        setMinimumResults(data.minimumResults);
        setCurrentResults(data.currentResults);
      }
    } catch (error) {
      console.error('Error fetching insights summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [locale]);

  const labels = {
    title: locale === 'tr' ? 'Haftalık Performans' : 'Weekly Performance',
    period: locale === 'tr' ? 'Dönem' : 'Period',
    views: locale === 'tr' ? 'Görüntüleme' : 'Views',
    engagement: locale === 'tr' ? 'Etkileşim' : 'Engagement',
    content: locale === 'tr' ? 'İçerik' : 'Content',
    bestPlatform: locale === 'tr' ? 'En İyi Platform' : 'Best Platform',
    recommendation: locale === 'tr' ? 'Öneri' : 'Recommendation',
    seeDetails: locale === 'tr' ? 'Detayları Gör' : 'See Details',
    noData: locale === 'tr'
      ? `İçgörüler için en az ${minimumResults} sonuç gerekli. Şu an ${currentResults} sonucunuz var.`
      : `At least ${minimumResults} results needed. You have ${currentResults}.`,
    proOnly: locale === 'tr'
      ? 'Detaylı içgörüler PRO planında'
      : 'Detailed insights in PRO plan',
    upgrade: locale === 'tr' ? 'PRO\'ya Yükselt' : 'Upgrade to PRO',
  };

  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < -5) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatChange = (change: number) => {
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{labels.title}</h3>
            {summary?.periodLabel && (
              <p className="text-sm text-gray-500">{summary.periodLabel}</p>
            )}
          </div>
        </div>
      </div>

      {/* No Data State */}
      {!hasData && (
        <div className="text-center py-6">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">{labels.noData}</p>
        </div>
      )}

      {/* Has Data */}
      {hasData && summary && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Views */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{labels.views}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {summary.totalViews.toLocaleString()}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {getTrendIcon(summary.viewsChange)}
                <span className={`text-xs ${
                  summary.viewsChange > 0 ? 'text-green-600' :
                  summary.viewsChange < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {formatChange(summary.viewsChange)}
                </span>
              </div>
            </div>

            {/* Engagement */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{labels.engagement}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {summary.avgEngagement.toFixed(1)}%
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {getTrendIcon(summary.engagementChange)}
                <span className={`text-xs ${
                  summary.engagementChange > 0 ? 'text-green-600' :
                  summary.engagementChange < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {formatChange(summary.engagementChange)}
                </span>
              </div>
            </div>

            {/* Content Count */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{labels.content}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {summary.totalContent}
              </p>
            </div>
          </div>

          {/* Best Platform */}
          {summary.bestPlatform && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <span className="font-medium">{labels.bestPlatform}:</span>{' '}
                {summary.bestPlatform}
              </p>
            </div>
          )}

          {/* Top Recommendation */}
          {summary.topRecommendation && isPro && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">{labels.recommendation}:</span>{' '}
                {summary.topRecommendation}
              </p>
            </div>
          )}

          {/* PRO Upgrade CTA */}
          {!isPro && (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Lock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">{labels.proOnly}</p>
              <Link href={`/${locale}/app/account`}>
                <Button variant="outline" size="sm">
                  {labels.upgrade}
                </Button>
              </Link>
            </div>
          )}

          {/* See Details Link */}
          {isPro && (
            <Link
              href={`/${locale}/app/insights`}
              className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {labels.seeDetails} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
