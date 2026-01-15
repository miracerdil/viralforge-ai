import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasProAccess } from '@/lib/admin';
import type { Profile } from '@/lib/types/database';

const FREE_DAILY_LIMIT = 1;

export async function checkAndIncrementQuota(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  usedCredit?: boolean;
}> {
  const supabase = await createClient();

  // Get user's plan, comped_until, and analysis credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, comped_until, is_disabled, analysis_credit_balance')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { allowed: false, currentCount: 0, limit: 0 };
  }

  // Check if account is disabled
  if (profile.is_disabled) {
    return { allowed: false, currentCount: 0, limit: 0 };
  }

  // Pro users or comped users have unlimited access
  if (hasProAccess(profile.plan, profile.comped_until)) {
    return { allowed: true, currentCount: 0, limit: Infinity };
  }

  // Get today's date in UTC
  const today = new Date().toISOString().split('T')[0];

  // Check current usage
  const { data: usage } = await supabase
    .from('usage_daily')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const currentCount = usage?.analyses_count || 0;

  if (currentCount >= FREE_DAILY_LIMIT) {
    // Daily limit exceeded - check if user has analysis credits from reward shop
    const creditBalance = (profile as unknown as { analysis_credit_balance?: number }).analysis_credit_balance || 0;

    if (creditBalance > 0) {
      // Use one analysis credit
      const adminClient = createAdminClient();
      const { data: used, error: creditError } = await adminClient.rpc('use_analysis_credit', {
        p_user_id: userId,
      });

      if (!creditError && used) {
        return { allowed: true, currentCount, limit: FREE_DAILY_LIMIT, usedCredit: true };
      }
    }

    return { allowed: false, currentCount, limit: FREE_DAILY_LIMIT };
  }

  // Increment usage
  if (usage) {
    await supabase
      .from('usage_daily')
      .update({ analyses_count: currentCount + 1 })
      .eq('id', usage.id);
  } else {
    await supabase.from('usage_daily').insert({
      user_id: userId,
      date: today,
      analyses_count: 1,
    });
  }

  return { allowed: true, currentCount: currentCount + 1, limit: FREE_DAILY_LIMIT };
}

export async function getQuotaStatus(userId: string): Promise<{
  currentCount: number;
  limit: number;
  plan: Profile['plan'];
  isComped: boolean;
  analysisCredits: number;
}> {
  const supabase = await createClient();

  // Get user's plan, comped_until, and analysis credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, comped_until, analysis_credit_balance')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { currentCount: 0, limit: 0, plan: 'FREE', isComped: false, analysisCredits: 0 };
  }

  const isComped = hasProAccess(profile.plan, profile.comped_until) && profile.plan !== 'PRO';
  const analysisCredits = (profile as unknown as { analysis_credit_balance?: number }).analysis_credit_balance || 0;

  if (hasProAccess(profile.plan, profile.comped_until)) {
    return { currentCount: 0, limit: Infinity, plan: profile.plan, isComped, analysisCredits };
  }

  // Get today's usage
  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await supabase
    .from('usage_daily')
    .select('analyses_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  return {
    currentCount: usage?.analyses_count || 0,
    limit: FREE_DAILY_LIMIT,
    plan: profile.plan,
    isComped,
    analysisCredits,
  };
}
