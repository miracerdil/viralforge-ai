'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Zap, AlertTriangle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface StageData {
  stage: string;
  user_count: number;
  active_last_7_days: number;
  active_last_30_days: number;
}

interface LifecycleData {
  stages: StageData[];
  total_users: number;
  conversion_rates: {
    new_to_activated: number;
    activated_to_engaged: number;
    engaged_to_at_risk: number;
  };
}

const stageConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  new_user: { icon: UserPlus, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  activated: { icon: Zap, color: 'text-green-600', bgColor: 'bg-green-100' },
  engaged: { icon: TrendingUp, color: 'text-primary-600', bgColor: 'bg-primary-100' },
  at_risk: { icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  churn_risk: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

const stageLabels: Record<string, { tr: string; en: string }> = {
  new_user: { tr: 'Yeni Kullanıcı', en: 'New User' },
  activated: { tr: 'Aktifleşmiş', en: 'Activated' },
  engaged: { tr: 'Etkileşimli', en: 'Engaged' },
  at_risk: { tr: 'Risk Altında', en: 'At Risk' },
  churn_risk: { tr: 'Kayıp Riski', en: 'Churn Risk' },
};

export default function LifecycleFunnelPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LifecycleData | null>(null);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/lifecycle');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch lifecycle data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const stages = ['new_user', 'activated', 'engaged', 'at_risk', 'churn_risk'];
  const maxCount = data ? Math.max(...data.stages.map(s => s.user_count), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {locale === 'tr' ? 'Yaşam Döngüsü Hunisi' : 'Lifecycle Funnel'}
        </h1>
        <p className="text-gray-600 mt-1">
          {locale === 'tr'
            ? 'Kullanıcıların platformdaki yolculuğunu takip edin'
            : 'Track user journey through the platform'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {locale === 'tr' ? 'Toplam Kullanıcı' : 'Total Users'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{data?.total_users || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {locale === 'tr' ? 'Aktivasyon Oranı' : 'Activation Rate'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.conversion_rates.new_to_activated.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {locale === 'tr' ? 'Etkileşim Oranı' : 'Engagement Rate'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.conversion_rates.activated_to_engaged.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {locale === 'tr' ? 'Kayıp Oranı' : 'Churn Rate'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.conversion_rates.engaged_to_at_risk.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === 'tr' ? 'Kullanıcı Dağılımı' : 'User Distribution'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const stageData = data?.stages.find(s => s.stage === stage);
              const count = stageData?.user_count || 0;
              const percentage = data?.total_users ? ((count / data.total_users) * 100) : 0;
              const barWidth = (count / maxCount) * 100;
              const config = stageConfig[stage];
              const Icon = config.icon;

              return (
                <div key={stage} className="relative">
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {stageLabels[stage][locale as 'tr' | 'en']}
                        </span>
                        <span className="text-sm text-gray-500">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className={`h-full ${config.bgColor} transition-all duration-500`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {index < stages.length - 1 && (
                    <div className="flex items-center justify-center my-2">
                      <div className="w-0.5 h-4 bg-gray-200" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stage Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === 'tr' ? 'Detaylı Aktivite' : 'Detailed Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    {locale === 'tr' ? 'Aşama' : 'Stage'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    {locale === 'tr' ? 'Toplam' : 'Total'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    {locale === 'tr' ? 'Son 7 Gün Aktif' : 'Active Last 7 Days'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    {locale === 'tr' ? 'Son 30 Gün Aktif' : 'Active Last 30 Days'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stages.map((stage) => {
                  const stageData = data?.stages.find(s => s.stage === stage);
                  const config = stageConfig[stage];
                  const Icon = config.icon;

                  return (
                    <tr key={stage} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <span className="font-medium text-gray-900">
                            {stageLabels[stage][locale as 'tr' | 'en']}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {stageData?.user_count || 0}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {stageData?.active_last_7_days || 0}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {stageData?.active_last_30_days || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
