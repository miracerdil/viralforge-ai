'use client';

import { Crown, CreditCard, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface Profile {
  id: string;
  email: string;
  name?: string;
  plan: string;
  comped_until?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

interface PlanStatusCardProps {
  profile: Profile | null;
  locale: string;
  dictionary: Dictionary;
  onUpgrade: () => void;
  onManage: () => void;
}

export function PlanStatusCard({
  profile,
  locale,
  dictionary,
  onUpgrade,
  onManage,
}: PlanStatusCardProps) {
  const t = dictionary.account || {};

  const planNames: Record<string, { tr: string; en: string }> = {
    free: { tr: 'Ücretsiz', en: 'Free' },
    FREE: { tr: 'Ücretsiz', en: 'Free' },
    pro: { tr: 'PRO', en: 'PRO' },
    PRO: { tr: 'PRO', en: 'PRO' },
    creator_pro: { tr: 'Creator PRO', en: 'Creator PRO' },
    CREATOR_PRO: { tr: 'Creator PRO', en: 'Creator PRO' },
    business: { tr: 'Business PRO', en: 'Business PRO' },
    BUSINESS: { tr: 'Business PRO', en: 'Business PRO' },
    business_pro: { tr: 'Business PRO', en: 'Business PRO' },
    BUSINESS_PRO: { tr: 'Business PRO', en: 'Business PRO' },
  };

  const currentPlan = profile?.plan || 'FREE';
  const normalizedPlan = currentPlan.toLowerCase();
  const planName = planNames[currentPlan]?.[locale as 'tr' | 'en']
    || planNames[normalizedPlan]?.[locale as 'tr' | 'en']
    || (normalizedPlan.includes('pro') ? 'PRO' : (locale === 'tr' ? 'Ücretsiz' : 'Free'));

  const isComped = profile?.comped_until && new Date(profile.comped_until) > new Date();
  const hasSubscription = !!profile?.stripe_subscription_id;

  // Determine status
  let status: 'active' | 'comped' | 'free' = 'free';
  if (hasSubscription) status = 'active';
  else if (isComped) status = 'comped';

  const statusLabels = {
    active: { tr: 'Aktif', en: 'Active', color: 'bg-green-100 text-green-700' },
    comped: { tr: 'Hediye', en: 'Comped', color: 'bg-purple-100 text-purple-700' },
    free: { tr: 'Ücretsiz', en: 'Free', color: 'bg-gray-100 text-gray-700' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span>{t.planStatus || (locale === 'tr' ? 'Plan Durumu' : 'Plan Status')}</span>
          </div>
          <Badge className={statusLabels[status].color}>
            {statusLabels[status][locale as 'tr' | 'en']}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Plan */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl">
          <div>
            <p className="text-sm text-gray-500">
              {t.currentPlan || (locale === 'tr' ? 'Mevcut Plan' : 'Current Plan')}
            </p>
            <p className="text-2xl font-bold text-gray-900">{planName}</p>
          </div>
          {normalizedPlan.includes('pro') || normalizedPlan === 'business' ? (
            <CheckCircle className="w-8 h-8 text-green-500" />
          ) : (
            <AlertCircle className="w-8 h-8 text-amber-500" />
          )}
        </div>

        {/* Subscription Info */}
        {hasSubscription && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">
                {t.nextRenewal || (locale === 'tr' ? 'Sonraki Yenileme' : 'Next Renewal')}
              </p>
              <p className="font-medium text-gray-900">
                {/* This would come from Stripe subscription data */}
                {locale === 'tr' ? 'Aktif abonelik' : 'Active subscription'}
              </p>
            </div>
          </div>
        )}

        {isComped && profile?.comped_until && (
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-purple-600">
                {t.compedUntil || (locale === 'tr' ? 'Hediye Bitiş' : 'Comped Until')}
              </p>
              <p className="font-medium text-purple-700">
                {new Date(profile.comped_until).toLocaleDateString(locale)}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {normalizedPlan === 'free' ? (
            <Button onClick={onUpgrade} className="flex-1 gap-2">
              <Crown className="w-4 h-4" />
              {t.upgradePlan || (locale === 'tr' ? 'Planı Yükselt' : 'Upgrade Plan')}
            </Button>
          ) : (
            <>
              <Button onClick={onUpgrade} variant="outline" className="flex-1 gap-2">
                <Crown className="w-4 h-4" />
                {t.changePlan || (locale === 'tr' ? 'Plan Değiştir' : 'Change Plan')}
              </Button>
              {hasSubscription && (
                <Button onClick={onManage} variant="ghost" className="flex-1 gap-2">
                  <CreditCard className="w-4 h-4" />
                  {t.manageSubscription || (locale === 'tr' ? 'Aboneliği Yönet' : 'Manage Subscription')}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
