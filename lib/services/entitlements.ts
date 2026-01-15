// Entitlements Service
// Central resolver for usage limits, thresholds, and feature gating

import type {
  PlanType,
  FeatureType,
  UsageStatus,
  UserEntitlements,
  FeatureUsage,
  UsageSummary,

} from '@/lib/types/entitlements';

const THRESHOLDS = {
  warning: 0.7,
  critical: 0.9,
  blocked: 1.0,
};

// Get usage status based on percentage
export function getUsageStatus(percentage: number): UsageStatus {
  if (percentage >= THRESHOLDS.blocked) return 'blocked';
  if (percentage >= THRESHOLDS.critical) return 'critical';
  if (percentage >= THRESHOLDS.warning) return 'warning';
  return 'ok';
}

// Calculate feature usage from entitlements
export function getFeatureUsage(
  entitlements: UserEntitlements,
  feature: FeatureType
): FeatureUsage {
  const usedKey = `${feature}_used` as keyof UserEntitlements;
  const limitKey = `${feature}_limit` as keyof UserEntitlements;
  const bonusKey = `bonus_${feature}` as keyof UserEntitlements;

  const used = (entitlements[usedKey] as number) || 0;
  const limit = (entitlements[limitKey] as number) || 0;
  const bonus = (entitlements[bonusKey] as number) || 0;

  const effectiveLimit = limit + bonus;
  const remaining = Math.max(0, effectiveLimit - used);
  const percentage = effectiveLimit > 0 ? used / effectiveLimit : 0;
  const status = getUsageStatus(percentage);

  return {
    feature,
    used,
    limit,
    bonus,
    effectiveLimit,
    remaining,
    percentage,
    status,
  };
}

// Get full usage summary
export function getUsageSummary(entitlements: UserEntitlements): UsageSummary {
  const features: FeatureType[] = ['hooks', 'abtest', 'planner', 'brand_kits', 'analyses'];

  const featureUsages = features.reduce(
    (acc, feature) => {
      acc[feature] = getFeatureUsage(entitlements, feature);
      return acc;
    },
    {} as Record<FeatureType, FeatureUsage>
  );

  // Calculate days until reset
  const resetDate = new Date(entitlements.usage_reset_at);
  resetDate.setDate(resetDate.getDate() + 30);
  const now = new Date();
  const daysUntilReset = Math.max(0, Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    plan: entitlements.plan,
    features: featureUsages,
    persona_enabled: entitlements.persona_enabled,
    performance_tracking_enabled: entitlements.performance_tracking_enabled,
    daysUntilReset,
  };
}

// Check if user can use a feature
export function canUseFeature(
  entitlements: UserEntitlements,
  feature: FeatureType
): { allowed: boolean; status: UsageStatus; remaining: number } {
  const usage = getFeatureUsage(entitlements, feature);

  return {
    allowed: usage.status !== 'blocked',
    status: usage.status,
    remaining: usage.remaining,
  };
}

// Get features that are near limit
export function getFeaturesNearLimit(
  entitlements: UserEntitlements
): FeatureUsage[] {
  const features: FeatureType[] = ['hooks', 'abtest', 'planner', 'brand_kits', 'analyses'];

  return features
    .map((f) => getFeatureUsage(entitlements, f))
    .filter((u) => u.status !== 'ok' && u.effectiveLimit > 0);
}

// Server-side: Fetch entitlements for user
export async function fetchEntitlements(
  supabase: any,
  userId: string
): Promise<UserEntitlements | null> {
  const { data, error } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching entitlements:', error);
    return null;
  }

  return data;
}

// Server-side: Increment usage counter
export async function incrementUsage(
  supabase: any,
  userId: string,
  feature: FeatureType,
  amount: number = 1
): Promise<boolean> {
  const column = `${feature}_used`;

  const { error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_column: column,
    p_amount: amount,
  });

  if (error) {
    // Fallback to direct update
    const { error: updateError } = await supabase
      .from('user_entitlements')
      .update({ [column]: supabase.raw(`${column} + ${amount}`) })
      .eq('user_id', userId);

    return !updateError;
  }

  return true;
}

// Server-side: Check and log limit hit
export async function checkAndLogLimitHit(
  supabase: any,
  userId: string,
  feature: FeatureType,
  entitlements: UserEntitlements
): Promise<{ allowed: boolean; status: UsageStatus }> {
  const check = canUseFeature(entitlements, feature);

  if (check.status === 'blocked') {
    // Log the blocked event
    await supabase.from('lifecycle_events').insert({
      user_id: userId,
      event_type: 'feature_blocked',
      feature,
      meta: { remaining: check.remaining },
    });
  } else if (check.status === 'critical' || check.status === 'warning') {
    // Log limit approaching
    await supabase.from('lifecycle_events').insert({
      user_id: userId,
      event_type: 'limit_hit',
      feature,
      meta: { status: check.status, remaining: check.remaining },
    });
  }

  return check;
}

// Plan display names
export const PLAN_DISPLAY_NAMES: Record<PlanType, { tr: string; en: string }> = {
  free: { tr: 'Ücretsiz', en: 'Free' },
  creator_pro: { tr: 'Creator PRO', en: 'Creator PRO' },
  business_pro: { tr: 'Business PRO', en: 'Business PRO' },
};

// Get recommended plan for upgrade
export function getRecommendedUpgradePlan(
  currentPlan: PlanType,
  blockedFeature?: FeatureType
): PlanType {
  if (currentPlan === 'free') {
    // If brand_kits blocked, recommend business
    if (blockedFeature === 'brand_kits') {
      return 'business_pro';
    }
    return 'creator_pro';
  }

  if (currentPlan === 'creator_pro') {
    return 'business_pro';
  }

  return currentPlan;
}
