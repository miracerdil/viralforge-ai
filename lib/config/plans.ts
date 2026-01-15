/**
 * Plan Configuration - Single Source of Truth
 * All plan limits, features, and pricing are defined here.
 * Used by: UI, entitlement resolver, Stripe webhook mapping
 */

export const PLAN_CONFIG = {
  free: {
    id: 'free',
    name: { tr: 'Ücretsiz', en: 'Free' },
    price: { tr: '₺0', en: '$0' },
    priceMonthly: 0,
    stripePriceId: null as string | null,
    limits: {
      monthly_hooks: 10,
      ab_tests: 3,
      content_plans: 5,
      video_analysis: 3,
      brand_kits: 0,
      daily_suggestions: 1,
      caption_generations: 3,
    },
    features: {
      persona_learning: false,
      performance_optimization: false,
      priority_support: false,
      api_access: false,
      weekly_insights: false,
    },
  },
  creator_pro: {
    id: 'creator_pro',
    name: { tr: 'Creator PRO', en: 'Creator PRO' },
    price: { tr: '₺149/ay', en: '$149/mo' },
    priceMonthly: 149,
    stripePriceId: process.env.STRIPE_CREATOR_PRO_PRICE_ID || null,
    limits: {
      monthly_hooks: 100,
      ab_tests: 50,
      content_plans: 50,
      video_analysis: 30,
      brand_kits: 1,
      daily_suggestions: 3,
      caption_generations: 50,
    },
    features: {
      persona_learning: true,
      performance_optimization: true,
      priority_support: true,
      api_access: false,
      weekly_insights: true,
    },
  },
  business_pro: {
    id: 'business_pro',
    name: { tr: 'Business PRO', en: 'Business PRO' },
    price: { tr: '₺299/ay', en: '$299/mo' },
    priceMonthly: 299,
    stripePriceId: process.env.STRIPE_BUSINESS_PRO_PRICE_ID || null,
    limits: {
      monthly_hooks: 500,
      ab_tests: 200,
      content_plans: 200,
      video_analysis: 100,
      brand_kits: 10,
      daily_suggestions: 5,
      caption_generations: 200,
    },
    features: {
      persona_learning: true,
      performance_optimization: true,
      priority_support: true,
      api_access: true,
      weekly_insights: true,
    },
  },
} as const;

// Type exports
export type PlanId = keyof typeof PLAN_CONFIG;
export type FeatureKey = keyof typeof PLAN_CONFIG.free.features;
export type LimitKey = keyof typeof PLAN_CONFIG.free.limits;

// Plan configuration type
export type PlanConfig = typeof PLAN_CONFIG[PlanId];

// Usage status thresholds
export const USAGE_THRESHOLDS = {
  warning: 0.7, // 70%
  critical: 0.9, // 90%
  blocked: 1.0, // 100%
} as const;

export type UsageStatus = 'ok' | 'warning' | 'critical' | 'blocked';

/**
 * Get plan configuration by plan ID
 */
export function getPlanConfig(planId: PlanId): PlanConfig {
  return PLAN_CONFIG[planId] || PLAN_CONFIG.free;
}

/**
 * Get plan ID by Stripe price ID
 */
export function getPlanByPriceId(priceId: string): PlanId {
  for (const [planId, config] of Object.entries(PLAN_CONFIG)) {
    if (config.stripePriceId === priceId) {
      return planId as PlanId;
    }
  }
  return 'free';
}

/**
 * Get Stripe price ID by plan ID
 */
export function getStripePriceId(planId: PlanId): string | null {
  return PLAN_CONFIG[planId]?.stripePriceId || null;
}

/**
 * Check if plan has a specific feature
 */
export function planHasFeature(planId: PlanId, feature: FeatureKey): boolean {
  return PLAN_CONFIG[planId]?.features[feature] || false;
}

/**
 * Get limit for a plan
 */
export function getPlanLimit(planId: PlanId, limit: LimitKey): number {
  return PLAN_CONFIG[planId]?.limits[limit] || 0;
}

/**
 * Calculate usage status based on used vs limit
 */
export function calculateUsageStatus(used: number, limit: number): UsageStatus {
  if (limit === 0) return 'blocked';
  const percentage = used / limit;
  if (percentage >= USAGE_THRESHOLDS.blocked) return 'blocked';
  if (percentage >= USAGE_THRESHOLDS.critical) return 'critical';
  if (percentage >= USAGE_THRESHOLDS.warning) return 'warning';
  return 'ok';
}

/**
 * Map limit key to database column name
 */
export function limitKeyToColumn(key: LimitKey): string {
  const mapping: Record<LimitKey, string> = {
    monthly_hooks: 'hooks_used',
    ab_tests: 'ab_tests_used',
    content_plans: 'content_plans_used',
    video_analysis: 'video_analysis_used',
    brand_kits: 'brand_kits_created',
    daily_suggestions: 'daily_suggestions_used',
    caption_generations: 'caption_generations_used',
  };
  return mapping[key];
}

/**
 * All plan IDs in order (for UI display)
 */
export const PLAN_ORDER: PlanId[] = ['free', 'creator_pro', 'business_pro'];

/**
 * Feature display names
 */
export const FEATURE_NAMES: Record<FeatureKey, { tr: string; en: string }> = {
  persona_learning: {
    tr: 'Persona Öğrenme',
    en: 'Persona Learning',
  },
  performance_optimization: {
    tr: 'Performans Optimizasyonu',
    en: 'Performance Optimization',
  },
  priority_support: {
    tr: 'Öncelikli Destek',
    en: 'Priority Support',
  },
  api_access: {
    tr: 'API Erişimi',
    en: 'API Access',
  },
  weekly_insights: {
    tr: 'Haftalık İçgörüler',
    en: 'Weekly Insights',
  },
};

/**
 * Limit display names
 */
export const LIMIT_NAMES: Record<LimitKey, { tr: string; en: string }> = {
  monthly_hooks: {
    tr: 'Aylık Hook Kredisi',
    en: 'Monthly Hook Credits',
  },
  ab_tests: {
    tr: 'A/B Test',
    en: 'A/B Tests',
  },
  content_plans: {
    tr: 'İçerik Planı',
    en: 'Content Plans',
  },
  video_analysis: {
    tr: 'Video Analizi',
    en: 'Video Analysis',
  },
  brand_kits: {
    tr: 'Marka Kiti',
    en: 'Brand Kits',
  },
  daily_suggestions: {
    tr: 'Günlük Öneri',
    en: 'Daily Suggestions',
  },
  caption_generations: {
    tr: 'Caption Üretimi',
    en: 'Caption Generations',
  },
};
