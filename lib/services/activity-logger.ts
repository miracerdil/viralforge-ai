import { SupabaseClient } from '@supabase/supabase-js';

export type ActivityAction =
  | 'hook_generated'
  | 'video_analyzed'
  | 'planner_created'
  | 'ab_test_created'
  | 'ab_test_winner_selected'
  | 'performance_result_added'
  | 'reward_redeemed'
  | 'xp_earned'
  | 'xp_spent'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'subscription_renewed'
  | 'streak_achieved'
  | 'milestone_reached'
  | 'hook_exported'
  | 'hook_shared'
  | 'share_created';

interface LogActivityOptions {
  actionLabel?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

const actionLabels: Record<ActivityAction, { tr: string; en: string }> = {
  hook_generated: { tr: 'Hook oluşturuldu', en: 'Hook generated' },
  video_analyzed: { tr: 'Video analiz edildi', en: 'Video analyzed' },
  planner_created: { tr: 'İçerik planı oluşturuldu', en: 'Content plan created' },
  ab_test_created: { tr: 'A/B testi oluşturuldu', en: 'A/B test created' },
  ab_test_winner_selected: { tr: 'A/B test kazananı seçildi', en: 'A/B test winner selected' },
  performance_result_added: { tr: 'Performans sonucu eklendi', en: 'Performance result added' },
  reward_redeemed: { tr: 'Ödül kullanıldı', en: 'Reward redeemed' },
  xp_earned: { tr: 'XP kazanıldı', en: 'XP earned' },
  xp_spent: { tr: 'XP harcandı', en: 'XP spent' },
  plan_upgraded: { tr: 'Plan yükseltildi', en: 'Plan upgraded' },
  plan_downgraded: { tr: 'Plan düşürüldü', en: 'Plan downgraded' },
  subscription_renewed: { tr: 'Abonelik yenilendi', en: 'Subscription renewed' },
  streak_achieved: { tr: 'Seri başarısı', en: 'Streak achieved' },
  milestone_reached: { tr: 'Kilometre taşına ulaşıldı', en: 'Milestone reached' },
  hook_exported: { tr: 'Hook dışa aktarıldı', en: 'Hook exported' },
  hook_shared: { tr: 'Hook paylaşıldı', en: 'Hook shared' },
  share_created: { tr: 'Paylaşım linki oluşturuldu', en: 'Share link created' },
};

/**
 * Log a user activity to the activity log table.
 * This function is safe to call from API routes - it won't throw on failure.
 */
export async function logActivity(
  supabase: SupabaseClient,
  userId: string,
  action: ActivityAction,
  options: LogActivityOptions = {}
): Promise<void> {
  try {
    const { actionLabel, entityType, entityId, metadata = {} } = options;

    const { error } = await supabase.from('user_activity_log').insert({
      user_id: userId,
      action,
      action_label: actionLabel || actionLabels[action]?.en || action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      metadata,
    });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (error) {
    // Silently fail - we don't want activity logging to break the main flow
    console.error('Activity logging error:', error);
  }
}

/**
 * Log activity with locale-aware label.
 */
export async function logActivityWithLocale(
  supabase: SupabaseClient,
  userId: string,
  action: ActivityAction,
  locale: string,
  options: Omit<LogActivityOptions, 'actionLabel'> = {}
): Promise<void> {
  const label = actionLabels[action]?.[locale as 'tr' | 'en'] || actionLabels[action]?.en || action;
  return logActivity(supabase, userId, action, { ...options, actionLabel: label });
}

/**
 * Batch log multiple activities at once.
 */
export async function logActivities(
  supabase: SupabaseClient,
  userId: string,
  activities: Array<{ action: ActivityAction; options?: LogActivityOptions }>
): Promise<void> {
  try {
    const records = activities.map(({ action, options = {} }) => ({
      user_id: userId,
      action,
      action_label: options.actionLabel || actionLabels[action]?.en || action,
      entity_type: options.entityType || null,
      entity_id: options.entityId || null,
      metadata: options.metadata || {},
    }));

    const { error } = await supabase.from('user_activity_log').insert(records);

    if (error) {
      console.error('Failed to log activities:', error);
    }
  } catch (error) {
    console.error('Activity logging error:', error);
  }
}
