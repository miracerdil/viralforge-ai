'use client';

import { useState } from 'react';
import { X, Check, Crown, Zap, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import { PLAN_CONFIG, type PlanId, LIMIT_NAMES, FEATURE_NAMES } from '@/lib/config/plans';

interface PlanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanId | string;
  locale: string;
  dictionary: Dictionary;
}

interface PlanFeature {
  key: string;
  free: string | boolean;
  creator_pro: string | boolean;
  business_pro: string | boolean;
}

export function PlanComparisonModal({
  isOpen,
  onClose,
  currentPlan,
  locale,
  dictionary,
}: PlanComparisonModalProps) {
  const [loading, setLoading] = useState<PlanId | null>(null);

  const handleCheckout = async (plan: PlanId) => {
    if (plan === 'free' || plan === currentPlan) return;

    setLoading(plan);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          plan, // Now uses 'creator_pro' or 'business_pro' directly
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  const lang = locale as 'tr' | 'en';

  // Use centralized PLAN_CONFIG
  const plans = {
    free: {
      name: PLAN_CONFIG.free.name[lang],
      price: PLAN_CONFIG.free.price[lang],
      period: locale === 'tr' ? '/ay' : '/mo',
      icon: <Zap className="w-6 h-6" />,
      color: 'gray',
    },
    creator_pro: {
      name: PLAN_CONFIG.creator_pro.name[lang],
      price: `₺${PLAN_CONFIG.creator_pro.priceMonthly}`,
      period: locale === 'tr' ? '/ay' : '/mo',
      icon: <Crown className="w-6 h-6" />,
      color: 'primary',
    },
    business_pro: {
      name: PLAN_CONFIG.business_pro.name[lang],
      price: `₺${PLAN_CONFIG.business_pro.priceMonthly}`,
      period: locale === 'tr' ? '/ay' : '/mo',
      icon: <Building2 className="w-6 h-6" />,
      color: 'purple',
    },
  };

  // Build features from PLAN_CONFIG
  const features: PlanFeature[] = [
    {
      key: LIMIT_NAMES.monthly_hooks[lang],
      free: String(PLAN_CONFIG.free.limits.monthly_hooks),
      creator_pro: String(PLAN_CONFIG.creator_pro.limits.monthly_hooks),
      business_pro: String(PLAN_CONFIG.business_pro.limits.monthly_hooks),
    },
    {
      key: LIMIT_NAMES.ab_tests[lang],
      free: String(PLAN_CONFIG.free.limits.ab_tests),
      creator_pro: String(PLAN_CONFIG.creator_pro.limits.ab_tests),
      business_pro: String(PLAN_CONFIG.business_pro.limits.ab_tests),
    },
    {
      key: LIMIT_NAMES.content_plans[lang],
      free: String(PLAN_CONFIG.free.limits.content_plans),
      creator_pro: String(PLAN_CONFIG.creator_pro.limits.content_plans),
      business_pro: String(PLAN_CONFIG.business_pro.limits.content_plans),
    },
    {
      key: LIMIT_NAMES.video_analysis[lang],
      free: String(PLAN_CONFIG.free.limits.video_analysis),
      creator_pro: String(PLAN_CONFIG.creator_pro.limits.video_analysis),
      business_pro: String(PLAN_CONFIG.business_pro.limits.video_analysis),
    },
    {
      key: LIMIT_NAMES.brand_kits[lang],
      free: PLAN_CONFIG.free.limits.brand_kits === 0 ? '-' : String(PLAN_CONFIG.free.limits.brand_kits),
      creator_pro: String(PLAN_CONFIG.creator_pro.limits.brand_kits),
      business_pro: String(PLAN_CONFIG.business_pro.limits.brand_kits),
    },
    {
      key: FEATURE_NAMES.persona_learning[lang],
      free: PLAN_CONFIG.free.features.persona_learning,
      creator_pro: PLAN_CONFIG.creator_pro.features.persona_learning,
      business_pro: PLAN_CONFIG.business_pro.features.persona_learning,
    },
    {
      key: FEATURE_NAMES.performance_optimization[lang],
      free: PLAN_CONFIG.free.features.performance_optimization,
      creator_pro: PLAN_CONFIG.creator_pro.features.performance_optimization,
      business_pro: PLAN_CONFIG.business_pro.features.performance_optimization,
    },
    {
      key: FEATURE_NAMES.priority_support[lang],
      free: PLAN_CONFIG.free.features.priority_support,
      creator_pro: PLAN_CONFIG.creator_pro.features.priority_support,
      business_pro: PLAN_CONFIG.business_pro.features.priority_support,
    },
    {
      key: FEATURE_NAMES.api_access[lang],
      free: PLAN_CONFIG.free.features.api_access,
      creator_pro: PLAN_CONFIG.creator_pro.features.api_access,
      business_pro: PLAN_CONFIG.business_pro.features.api_access,
    },
  ];

  const renderValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-300 mx-auto" />
      );
    }
    return <span className="font-medium">{value}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {locale === 'tr' ? 'Plan Seç' : 'Choose Plan'}
            </h2>
            <p className="text-sm text-gray-500">
              {locale === 'tr'
                ? 'İhtiyacınıza uygun planı seçin'
                : 'Select the plan that fits your needs'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Plan Cards */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {(Object.keys(plans) as PlanId[]).map((planKey) => {
              const plan = plans[planKey];
              const isCurrentPlan = planKey === currentPlan;
              const isPopular = planKey === 'creator_pro';

              return (
                <div
                  key={planKey}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    isCurrentPlan
                      ? 'border-green-500 bg-green-50'
                      : isPopular
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isPopular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                        {locale === 'tr' ? 'Popüler' : 'Popular'}
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                        {locale === 'tr' ? 'Mevcut Plan' : 'Current Plan'}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div
                      className={`inline-flex p-3 rounded-full mb-3 ${
                        planKey === 'free'
                          ? 'bg-gray-100'
                          : planKey === 'creator_pro'
                            ? 'bg-primary-100'
                            : 'bg-purple-100'
                      }`}
                    >
                      {plan.icon}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-500">{plan.period}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleCheckout(planKey)}
                    disabled={isCurrentPlan || planKey === 'free'}
                    isLoading={loading === planKey}
                    className={`w-full ${
                      planKey === 'creator_pro'
                        ? 'bg-primary-600 hover:bg-primary-700'
                        : planKey === 'business_pro'
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : ''
                    }`}
                    variant={planKey === 'free' ? 'outline' : 'primary'}
                  >
                    {isCurrentPlan
                      ? locale === 'tr'
                        ? 'Mevcut Plan'
                        : 'Current Plan'
                      : planKey === 'free'
                        ? locale === 'tr'
                          ? 'Ücretsiz'
                          : 'Free'
                        : locale === 'tr'
                          ? 'Seç'
                          : 'Select'}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    {locale === 'tr' ? 'Özellik' : 'Feature'}
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                    {plans.free.name}
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-primary-600">
                    {plans.creator_pro.name}
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-purple-600">
                    {plans.business_pro.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={feature.key}
                    className={index % 2 === 0 ? 'bg-gray-50' : ''}
                  >
                    <td className="py-3 px-4 text-sm text-gray-700">{feature.key}</td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {renderValue(feature.free)}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {renderValue(feature.creator_pro)}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {renderValue(feature.business_pro)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
