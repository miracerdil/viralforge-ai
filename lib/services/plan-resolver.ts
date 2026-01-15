/**
 * Plan Resolver Service
 * Central resolver for effective entitlements using PLAN_CONFIG and usage_counters
 */

import {
  PLAN_CONFIG,
  type PlanId,
  type LimitKey,
  type FeatureKey,
  type UsageStatus,
  getPlanConfig,
  getPlanLimit,
  planHasFeature,
  calculateUsageStatus,
  limitKeyToColumn,
} from '@/lib/config/plans';
import { triggerUsageWarning } from './notification-triggers';

// Types
export interface UserProfile {
  id: string;
  plan: PlanId;
  comped_until?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  subscription_status?: string | null;
}

export interface UsageCounters {
  hooks_used: number;
  ab_tests_used: number;
  content_plans_used: number;
  video_analysis_used: number;
  brand_kits_created: number;
  daily_suggestions_used: number;
  caption_generations_used: number;
  period_start: string;
  period_end: string;
}

export interface EffectiveEntitlements {
  plan: PlanId;
  planName: { tr: string; en: string };
  isComped: boolean;
  isActive: boolean; // Has active subscription or comped
  periodStart: Date | null;
  periodEnd: Date | null;
  limits: Record<LimitKey, number>;
  features: Record<FeatureKey, boolean>;
  usage: Record<LimitKey, { used: number; limit: number; remaining: number; status: UsageStatus }>;
}

export interface FeatureCheck {
  allowed: boolean;
  remaining: number;
  status: UsageStatus;
  limit: number;
  used: number;
}

/**
 * Check if user has active comped access
 */
export function isComped(compedUntil: string | null | undefined): boolean {
  if (!compedUntil) return false;
  return new Date(compedUntil) > new Date();
}

/**
 * Determine effective plan considering comped status
 */
export function getEffectivePlan(profile: UserProfile): PlanId {
  // Comped users get creator_pro features (unless they already have business_pro)
  if (isComped(profile.comped_until)) {
    if (profile.plan === 'business_pro') return 'business_pro';
    return 'creator_pro';
  }
  return profile.plan as PlanId;
}

/**
 * Get effective entitlements for a user
 * This is the main resolver function that combines profile, plan config, and usage
 */
export async function getEffectiveEntitlements(
  supabase: any,
  userId: string
): Promise<EffectiveEntitlements | null> {
  try {
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, plan, comped_until, current_period_start, current_period_end, subscription_status')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    // Get effective plan (considering comped)
    const effectivePlan = getEffectivePlan(profile);
    const planConfig = getPlanConfig(effectivePlan);
    const userIsComped = isComped(profile.comped_until);

    // Fetch current usage counters
    const { data: usageData } = await supabase.rpc('get_current_usage', {
      p_user_id: userId,
    });

    const usage = usageData?.[0] || {
      hooks_used: 0,
      ab_tests_used: 0,
      content_plans_used: 0,
      video_analysis_used: 0,
      brand_kits_created: 0,
      daily_suggestions_used: 0,
      caption_generations_used: 0,
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
    };

    // Build usage summary
    const usageSummary: Record<LimitKey, { used: number; limit: number; remaining: number; status: UsageStatus }> = {
      monthly_hooks: {
        used: usage.hooks_used,
        limit: planConfig.limits.monthly_hooks,
        remaining: Math.max(0, planConfig.limits.monthly_hooks - usage.hooks_used),
        status: calculateUsageStatus(usage.hooks_used, planConfig.limits.monthly_hooks),
      },
      ab_tests: {
        used: usage.ab_tests_used,
        limit: planConfig.limits.ab_tests,
        remaining: Math.max(0, planConfig.limits.ab_tests - usage.ab_tests_used),
        status: calculateUsageStatus(usage.ab_tests_used, planConfig.limits.ab_tests),
      },
      content_plans: {
        used: usage.content_plans_used,
        limit: planConfig.limits.content_plans,
        remaining: Math.max(0, planConfig.limits.content_plans - usage.content_plans_used),
        status: calculateUsageStatus(usage.content_plans_used, planConfig.limits.content_plans),
      },
      video_analysis: {
        used: usage.video_analysis_used,
        limit: planConfig.limits.video_analysis,
        remaining: Math.max(0, planConfig.limits.video_analysis - usage.video_analysis_used),
        status: calculateUsageStatus(usage.video_analysis_used, planConfig.limits.video_analysis),
      },
      brand_kits: {
        used: usage.brand_kits_created,
        limit: planConfig.limits.brand_kits,
        remaining: Math.max(0, planConfig.limits.brand_kits - usage.brand_kits_created),
        status: calculateUsageStatus(usage.brand_kits_created, planConfig.limits.brand_kits),
      },
      daily_suggestions: {
        used: usage.daily_suggestions_used,
        limit: planConfig.limits.daily_suggestions,
        remaining: Math.max(0, planConfig.limits.daily_suggestions - usage.daily_suggestions_used),
        status: calculateUsageStatus(usage.daily_suggestions_used, planConfig.limits.daily_suggestions),
      },
      caption_generations: {
        used: usage.caption_generations_used,
        limit: planConfig.limits.caption_generations,
        remaining: Math.max(0, planConfig.limits.caption_generations - usage.caption_generations_used),
        status: calculateUsageStatus(usage.caption_generations_used, planConfig.limits.caption_generations),
      },
    };

    return {
      plan: effectivePlan,
      planName: planConfig.name,
      isComped: userIsComped,
      isActive: effectivePlan !== 'free' || userIsComped,
      periodStart: profile.current_period_start ? new Date(profile.current_period_start) : null,
      periodEnd: profile.current_period_end ? new Date(profile.current_period_end) : null,
      limits: { ...planConfig.limits },
      features: { ...planConfig.features },
      usage: usageSummary,
    };
  } catch (error) {
    console.error('Error getting effective entitlements:', error);
    return null;
  }
}

/**
 * Get current usage for a user
 */
export async function getCurrentUsage(
  supabase: any,
  userId: string
): Promise<UsageCounters | null> {
  try {
    const { data, error } = await supabase.rpc('get_current_usage', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching usage:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error getting current usage:', error);
    return null;
  }
}

/**
 * Check if user can use a feature (quick check)
 */
export async function canUseFeature(
  supabase: any,
  userId: string,
  feature: LimitKey
): Promise<FeatureCheck> {
  const entitlements = await getEffectiveEntitlements(supabase, userId);

  if (!entitlements) {
    return {
      allowed: false,
      remaining: 0,
      status: 'blocked',
      limit: 0,
      used: 0,
    };
  }

  const usageInfo = entitlements.usage[feature];

  return {
    allowed: usageInfo.status !== 'blocked',
    remaining: usageInfo.remaining,
    status: usageInfo.status,
    limit: usageInfo.limit,
    used: usageInfo.used,
  };
}

/**
 * Check if user has a boolean feature enabled
 */
export async function hasFeature(
  supabase: any,
  userId: string,
  feature: FeatureKey
): Promise<boolean> {
  const entitlements = await getEffectiveEntitlements(supabase, userId);

  if (!entitlements) {
    return false;
  }

  return entitlements.features[feature];
}

/**
 * Increment usage and check status
 */
export async function incrementUsageAndCheck(
  supabase: any,
  userId: string,
  feature: LimitKey,
  amount: number = 1
): Promise<{ success: boolean; newStatus: UsageStatus; remaining: number }> {
  const column = limitKeyToColumn(feature);

  try {
    // Increment using database function
    const { data, error } = await supabase.rpc('increment_usage_counter', {
      p_user_id: userId,
      p_column: column,
      p_amount: amount,
    });

    if (error) {
      console.error('Error incrementing usage:', error);
      return { success: false, newStatus: 'ok', remaining: 0 };
    }

    // Get updated entitlements to calculate new status
    const entitlements = await getEffectiveEntitlements(supabase, userId);

    if (!entitlements) {
      return { success: true, newStatus: 'ok', remaining: 0 };
    }

    const usageInfo = entitlements.usage[feature];

    // Log lifecycle event and trigger notification if status changed
    if (usageInfo.status === 'blocked' || usageInfo.status === 'critical' || usageInfo.status === 'warning') {
      await logUsageEvent(supabase, userId, feature, usageInfo.status, usageInfo.remaining);

      // Trigger usage warning notification
      const usagePercentage = usageInfo.limit > 0
        ? Math.round((usageInfo.used / usageInfo.limit) * 100)
        : 0;
      await triggerUsageWarning(supabase, userId, feature, usagePercentage);
    }

    return {
      success: true,
      newStatus: usageInfo.status,
      remaining: usageInfo.remaining,
    };
  } catch (error) {
    console.error('Error in incrementUsageAndCheck:', error);
    return { success: false, newStatus: 'ok', remaining: 0 };
  }
}

/**
 * Log usage lifecycle event
 */
async function logUsageEvent(
  supabase: any,
  userId: string,
  feature: LimitKey,
  status: UsageStatus,
  remaining: number
): Promise<void> {
  try {
    const eventType = status === 'blocked' ? 'feature_blocked' : 'limit_approaching';

    await supabase.from('lifecycle_events').insert({
      user_id: userId,
      event_type: eventType,
      feature,
      meta: { status, remaining },
    });
  } catch (error) {
    console.error('Error logging usage event:', error);
  }
}

/**
 * Reset usage counters for new billing period
 */
export async function resetUsageCounters(
  supabase: any,
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<boolean> {
  try {
    // Insert new counters for new period (old ones are kept for history)
    const { error } = await supabase.from('usage_counters').upsert({
      user_id: userId,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      hooks_used: 0,
      ab_tests_used: 0,
      content_plans_used: 0,
      video_analysis_used: 0,
      brand_kits_created: 0,
    }, {
      onConflict: 'user_id,period_start',
    });

    return !error;
  } catch (error) {
    console.error('Error resetting usage counters:', error);
    return false;
  }
}

/**
 * Get all features that are near or at limit
 */
export async function getFeaturesNearLimit(
  supabase: any,
  userId: string
): Promise<Array<{ feature: LimitKey; status: UsageStatus; remaining: number }>> {
  const entitlements = await getEffectiveEntitlements(supabase, userId);

  if (!entitlements) {
    return [];
  }

  const nearLimit: Array<{ feature: LimitKey; status: UsageStatus; remaining: number }> = [];

  for (const [feature, info] of Object.entries(entitlements.usage)) {
    if (info.status !== 'ok' && info.limit > 0) {
      nearLimit.push({
        feature: feature as LimitKey,
        status: info.status,
        remaining: info.remaining,
      });
    }
  }

  return nearLimit;
}
