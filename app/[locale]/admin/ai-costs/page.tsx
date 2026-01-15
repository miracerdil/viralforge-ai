'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Zap, TrendingUp, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface AICostData {
  summary: {
    total_cost: number;
    total_requests: number;
    total_tokens: number;
    avg_cost_per_request: number;
    period_days: number;
  };
  daily: Array<{ date: string; cost: number; requests: number; tokens: number }>;
  by_feature: Array<{ feature: string; cost: number; requests: number; tokens: number }>;
  by_model: Array<{ model: string; cost: number; requests: number; tokens: number }>;
  top_users: Array<{ id: string; email: string; name: string | null; cost: number; requests: number }>;
}

const featureLabels: Record<string, { tr: string; en: string }> = {
  hook_generation: { tr: 'Hook Üretimi', en: 'Hook Generation' },
  video_analysis: { tr: 'Video Analizi', en: 'Video Analysis' },
  planner: { tr: 'Planlayıcı', en: 'Planner' },
  ab_test: { tr: 'A/B Test', en: 'A/B Test' },
  caption_generation: { tr: 'Caption Üretimi', en: 'Caption Generation' },
  daily_suggestion: { tr: 'Günlük Öneri', en: 'Daily Suggestion' },
};

export default function AICostsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AICostData | null>(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/ai-costs?days=${period}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch AI costs:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!dictionary || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  const maxDailyCost = data ? Math.max(...data.daily.map(d => d.cost), 0.001) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === 'tr' ? 'AI Maliyet Takibi' : 'AI Cost Monitoring'}
          </h1>
          <p className="text-gray-600 mt-1">
            {locale === 'tr'
              ? 'OpenAI API kullanım ve maliyet analizi'
              : 'OpenAI API usage and cost analysis'}
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value={7}>{locale === 'tr' ? 'Son 7 Gün' : 'Last 7 Days'}</option>
          <option value={30}>{locale === 'tr' ? 'Son 30 Gün' : 'Last 30 Days'}</option>
          <option value={90}>{locale === 'tr' ? 'Son 90 Gün' : 'Last 90 Days'}</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {locale === 'tr' ? 'Toplam Maliyet' : 'Total Cost'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCost(data?.summary.total_cost || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {locale === 'tr' ? 'Toplam İstek' : 'Total Requests'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.summary.total_requests.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {locale === 'tr' ? 'Toplam Token' : 'Total Tokens'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTokens(data?.summary.total_tokens || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {locale === 'tr' ? 'Ort. İstek Maliyeti' : 'Avg. Request Cost'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCost(data?.summary.avg_cost_per_request || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === 'tr' ? 'Günlük Maliyet Trendi' : 'Daily Cost Trend'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.daily && data.daily.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-end gap-1 h-48">
                {data.daily.slice(-30).map((day, index) => {
                  const height = (day.cost / maxDailyCost) * 100;
                  return (
                    <div
                      key={day.date}
                      className="flex-1 min-w-0 group relative"
                    >
                      <div
                        className="w-full bg-primary-500 rounded-t hover:bg-primary-600 transition-colors"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                        {day.date}: {formatCost(day.cost)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{data.daily[0]?.date}</span>
                <span>{data.daily[data.daily.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">
              {locale === 'tr' ? 'Veri bulunamadı' : 'No data available'}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Feature */}
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'tr' ? 'Özellik Bazlı Maliyet' : 'Cost by Feature'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.by_feature.map((feature) => {
                const label = featureLabels[feature.feature]?.[locale as 'tr' | 'en'] || feature.feature;
                const percentage = data.summary.total_cost > 0
                  ? (feature.cost / data.summary.total_cost) * 100
                  : 0;

                return (
                  <div key={feature.feature}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{label}</span>
                      <span className="text-gray-500">
                        {formatCost(feature.cost)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!data?.by_feature || data.by_feature.length === 0) && (
                <p className="text-gray-500 text-center py-8">
                  {locale === 'tr' ? 'Veri bulunamadı' : 'No data available'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Model */}
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'tr' ? 'Model Bazlı Maliyet' : 'Cost by Model'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.by_model.map((model) => {
                const percentage = data.summary.total_cost > 0
                  ? (model.cost / data.summary.total_cost) * 100
                  : 0;

                return (
                  <div key={model.model}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{model.model}</span>
                      <span className="text-gray-500">
                        {formatCost(model.cost)} ({model.requests.toLocaleString()} {locale === 'tr' ? 'istek' : 'requests'})
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!data?.by_model || data.by_model.length === 0) && (
                <p className="text-gray-500 text-center py-8">
                  {locale === 'tr' ? 'Veri bulunamadı' : 'No data available'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {locale === 'tr' ? 'En Çok Harcayan Kullanıcılar' : 'Top Users by Cost'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">#</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    {locale === 'tr' ? 'Kullanıcı' : 'User'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    {locale === 'tr' ? 'İstek Sayısı' : 'Requests'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    {locale === 'tr' ? 'Maliyet' : 'Cost'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.top_users.map((user, index) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{user.name || user.email}</p>
                        {user.name && <p className="text-sm text-gray-500">{user.email}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {user.requests.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {formatCost(user.cost)}
                    </td>
                  </tr>
                ))}
                {(!data?.top_users || data.top_users.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      {locale === 'tr' ? 'Veri bulunamadı' : 'No data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
