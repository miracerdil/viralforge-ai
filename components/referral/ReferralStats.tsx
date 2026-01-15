'use client';

import { Users, UserCheck, Crown, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferralStatsProps {
  stats: {
    totalReferrals: number;
    signedUp: number;
    converted: number;
    totalXpEarned: number;
    totalCreditsEarned: number;
  };
  locale: string;
}

export function ReferralStats({ stats, locale }: ReferralStatsProps) {
  const t = {
    title: locale === 'tr' ? 'Referans İstatistikleri' : 'Referral Stats',
    totalReferrals: locale === 'tr' ? 'Toplam Davet' : 'Total Invites',
    signedUp: locale === 'tr' ? 'Kayıt Olan' : 'Signed Up',
    converted: locale === 'tr' ? 'PRO Olan' : 'Converted to PRO',
    xpEarned: locale === 'tr' ? 'Kazanılan XP' : 'XP Earned',
    creditsEarned: locale === 'tr' ? 'Kazanılan Kredi' : 'Credits Earned',
    conversionRate: locale === 'tr' ? 'Dönüşüm Oranı' : 'Conversion Rate',
  };

  const conversionRate = stats.totalReferrals > 0
    ? Math.round((stats.signedUp / stats.totalReferrals) * 100)
    : 0;

  const statItems = [
    {
      label: t.totalReferrals,
      value: stats.totalReferrals,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: t.signedUp,
      value: stats.signedUp,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: t.converted,
      value: stats.converted,
      icon: Crown,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: t.xpEarned,
      value: stats.totalXpEarned.toLocaleString(),
      icon: Sparkles,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      suffix: 'XP',
    },
    {
      label: t.creditsEarned,
      value: stats.totalCreditsEarned,
      icon: TrendingUp,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{t.title}</h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-gray-50"
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-2', item.bg)}>
                <Icon className={cn('w-5 h-5', item.color)} />
              </div>
              <span className={cn('text-2xl font-bold', item.color)}>
                {item.value}
                {item.suffix && <span className="text-sm ml-1">{item.suffix}</span>}
              </span>
              <span className="text-xs text-gray-500 mt-1">{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Conversion Rate Bar */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{t.conversionRate}</span>
          <span className="text-sm font-semibold text-primary-600">{conversionRate}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(conversionRate, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
