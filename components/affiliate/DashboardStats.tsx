'use client';

import { MousePointer, Users, DollarSign, Wallet, TrendingUp, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardStatsProps {
  affiliate: {
    affiliateCode: string;
    status: string;
    commissionRate: number;
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    totalPaid: number;
    pendingBalance: number;
    minPayoutAmount: number;
  };
  locale: string;
}

export function DashboardStats({ affiliate, locale }: DashboardStatsProps) {
  const [copied, setCopied] = useState(false);

  const affiliateLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/?aff=${affiliate.affiliateCode}`;

  const t = {
    yourLink: locale === 'tr' ? 'Affiliate Linkiniz' : 'Your Affiliate Link',
    copy: locale === 'tr' ? 'Kopyala' : 'Copy',
    copied: locale === 'tr' ? 'Kopyalandı!' : 'Copied!',
    stats: {
      clicks: locale === 'tr' ? 'Tıklama' : 'Clicks',
      conversions: locale === 'tr' ? 'Dönüşüm' : 'Conversions',
      earnings: locale === 'tr' ? 'Toplam Kazanç' : 'Total Earnings',
      pending: locale === 'tr' ? 'Bekleyen' : 'Pending',
      paid: locale === 'tr' ? 'Ödenen' : 'Paid',
      conversionRate: locale === 'tr' ? 'Dönüşüm Oranı' : 'Conversion Rate',
    },
    commission: locale === 'tr' ? 'Komisyon Oranı' : 'Commission Rate',
    minPayout: locale === 'tr' ? 'Minimum Ödeme' : 'Minimum Payout',
    requestPayout: locale === 'tr' ? 'Ödeme Talep Et' : 'Request Payout',
    payoutDisabled: locale === 'tr' ? 'Minimum tutara ulaşılmadı' : 'Minimum not reached',
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const conversionRate = affiliate.totalClicks > 0
    ? ((affiliate.totalConversions / affiliate.totalClicks) * 100).toFixed(1)
    : '0';

  const canRequestPayout = affiliate.pendingBalance >= affiliate.minPayoutAmount;

  const stats = [
    {
      label: t.stats.clicks,
      value: affiliate.totalClicks.toLocaleString(),
      icon: MousePointer,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: t.stats.conversions,
      value: affiliate.totalConversions.toLocaleString(),
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: t.stats.conversionRate,
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: t.stats.earnings,
      value: `$${affiliate.totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: t.stats.pending,
      value: `$${affiliate.pendingBalance.toFixed(2)}`,
      icon: Wallet,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      label: t.stats.paid,
      value: `$${affiliate.totalPaid.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Affiliate Link */}
      <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t.yourLink}</h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span>{t.commission}: <strong className="text-primary-600">{affiliate.commissionRate}%</strong></span>
              <span>{t.minPayout}: <strong>${affiliate.minPayoutAmount}</strong></span>
            </div>
          </div>
          <span className={cn(
            'px-3 py-1 text-sm font-medium rounded-full',
            affiliate.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          )}>
            {affiliate.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white rounded-lg px-4 py-3 text-sm text-gray-700 font-mono truncate border border-gray-200">
            {affiliateLink}
          </div>
          <Button variant="primary" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                {t.copied}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                {t.copy}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-4 text-center"
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3', stat.bg)}>
                <Icon className={cn('w-5 h-5', stat.color)} />
              </div>
              <div className={cn('text-xl font-bold', stat.color)}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Payout Request */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">{t.stats.pending}</h4>
            <p className="text-2xl font-bold text-primary-600 mt-1">
              ${affiliate.pendingBalance.toFixed(2)}
            </p>
          </div>
          <Button
            variant={canRequestPayout ? 'primary' : 'outline'}
            disabled={!canRequestPayout}
            title={!canRequestPayout ? t.payoutDisabled : ''}
          >
            <Wallet className="w-4 h-4 mr-2" />
            {t.requestPayout}
          </Button>
        </div>
        {!canRequestPayout && (
          <p className="text-sm text-gray-500 mt-2">
            {t.payoutDisabled} (${affiliate.minPayoutAmount} min)
          </p>
        )}
      </div>
    </div>
  );
}
