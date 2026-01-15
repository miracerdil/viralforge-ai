'use client';

import { BarChart3, AlertTriangle, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { UsageSummary, FeatureType, UsageStatus } from '@/lib/types/entitlements';
import { UPGRADE_MESSAGES } from '@/lib/types/entitlements';

interface UsageLimitsSectionProps {
  usageSummary: UsageSummary;
  locale: string;
  dictionary: Dictionary;
  onUpgrade: () => void;
}

const FEATURE_LABELS: Record<FeatureType, { tr: string; en: string; icon: string }> = {
  hooks: { tr: 'Hook Kredisi', en: 'Hook Credits', icon: 'Sparkles' },
  abtest: { tr: 'A/B Test', en: 'A/B Tests', icon: 'GitCompare' },
  planner: { tr: 'İçerik Planı', en: 'Content Plans', icon: 'Calendar' },
  brand_kits: { tr: 'Marka Kiti', en: 'Brand Kits', icon: 'Briefcase' },
  analyses: { tr: 'Video Analizi', en: 'Video Analyses', icon: 'LineChart' },
};

function UsageBar({
  used,
  limit,
  status,
}: {
  used: number;
  limit: number;
  status: UsageStatus;
}) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  const barColors: Record<UsageStatus, string> = {
    ok: 'bg-green-500',
    warning: 'bg-amber-500',
    critical: 'bg-orange-500',
    blocked: 'bg-red-500',
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{used} / {limit}</span>
        <span className="text-gray-500">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${barColors[status]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function UsageLimitsSection({
  usageSummary,
  locale,
  dictionary,
  onUpgrade,
}: UsageLimitsSectionProps) {
  const t = dictionary.account || {};

  const features: FeatureType[] = ['hooks', 'abtest', 'planner', 'analyses', 'brand_kits'];

  // Filter out features with 0 limit (e.g., brand_kits for free)
  const activeFeatures = features.filter(
    (f) => usageSummary.features[f].effectiveLimit > 0
  );

  const hasWarning = Object.values(usageSummary.features).some(
    (f) => f.status === 'warning' || f.status === 'critical' || f.status === 'blocked'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span>{t.usageLimits || (locale === 'tr' ? 'Kullanım Limitleri' : 'Usage Limits')}</span>
          </div>
          {usageSummary.daysUntilReset > 0 && (
            <span className="text-sm font-normal text-gray-500">
              {locale === 'tr'
                ? `${usageSummary.daysUntilReset} gün sonra sıfırlanır`
                : `Resets in ${usageSummary.daysUntilReset} days`}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeFeatures.map((feature) => {
          const usage = usageSummary.features[feature];
          const label = FEATURE_LABELS[feature][locale as 'tr' | 'en'];
          const isNearLimit = usage.status !== 'ok';

          return (
            <div key={feature} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">{label}</span>
                {isNearLimit && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">
                      {usage.status === 'blocked'
                        ? locale === 'tr' ? 'Limit doldu' : 'Limit reached'
                        : locale === 'tr' ? 'Limite yaklaşıyor' : 'Near limit'}
                    </span>
                  </div>
                )}
              </div>
              <UsageBar
                used={usage.used}
                limit={usage.effectiveLimit}
                status={usage.status}
              />
              {isNearLimit && usageSummary.plan === 'free' && (
                <p className="text-xs text-amber-600">
                  {UPGRADE_MESSAGES[feature][locale as 'tr' | 'en']}
                </p>
              )}
            </div>
          );
        })}

        {/* Upgrade CTA if near limit */}
        {hasWarning && usageSummary.plan === 'free' && (
          <div className="pt-4 border-t border-gray-100">
            <Button onClick={onUpgrade} variant="outline" className="w-full gap-2">
              <Crown className="w-4 h-4" />
              {t.getMoreLimits || (locale === 'tr' ? 'PRO ile daha fazla' : 'Get more with PRO')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
