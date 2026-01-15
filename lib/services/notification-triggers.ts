import { SupabaseClient } from '@supabase/supabase-js';

export type NotificationType = 'info' | 'warning' | 'success' | 'achievement' | 'system';

interface CreateNotificationOptions {
  type: NotificationType;
  title_tr: string;
  title_en: string;
  message_tr: string;
  message_en: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  options: CreateNotificationOptions
): Promise<void> {
  try {
    const { error } = await supabase.from('user_notifications').insert({
      user_id: userId,
      type: options.type,
      title_tr: options.title_tr,
      title_en: options.title_en,
      message_tr: options.message_tr,
      message_en: options.message_en,
      action_url: options.action_url || null,
      metadata: options.metadata || {},
      is_read: false,
    });

    if (error) {
      console.error('Failed to create notification:', error);
    }
  } catch (error) {
    console.error('Notification creation error:', error);
  }
}

/**
 * Trigger usage warning notification when user approaches or reaches limits
 */
export async function triggerUsageWarning(
  supabase: SupabaseClient,
  userId: string,
  feature: string,
  percentage: number
): Promise<void> {
  // Only trigger at specific thresholds
  if (![70, 90, 100].includes(percentage)) return;

  const featureLabels: Record<string, { tr: string; en: string }> = {
    monthly_hooks: { tr: 'Hook oluşturma', en: 'Hook generation' },
    ab_tests: { tr: 'A/B test', en: 'A/B tests' },
    video_analyses: { tr: 'Video analizi', en: 'Video analysis' },
    content_plans: { tr: 'İçerik planı', en: 'Content plans' },
  };

  const label = featureLabels[feature] || { tr: feature, en: feature };

  if (percentage === 70) {
    await createNotification(supabase, userId, {
      type: 'warning',
      title_tr: 'Kullanım Uyarısı',
      title_en: 'Usage Warning',
      message_tr: `${label.tr} limitinizin %70'ini kullandınız.`,
      message_en: `You've used 70% of your ${label.en} limit.`,
      action_url: '/account',
    });
  } else if (percentage === 90) {
    await createNotification(supabase, userId, {
      type: 'warning',
      title_tr: 'Kritik Kullanım',
      title_en: 'Critical Usage',
      message_tr: `${label.tr} limitinizin %90'ını kullandınız. Planınızı yükseltmeyi düşünün.`,
      message_en: `You've used 90% of your ${label.en} limit. Consider upgrading.`,
      action_url: '/pricing',
    });
  } else if (percentage === 100) {
    await createNotification(supabase, userId, {
      type: 'warning',
      title_tr: 'Limit Doldu',
      title_en: 'Limit Reached',
      message_tr: `${label.tr} limitinize ulaştınız. Devam etmek için planınızı yükseltin.`,
      message_en: `You've reached your ${label.en} limit. Upgrade to continue.`,
      action_url: '/pricing',
    });
  }
}

/**
 * Trigger streak milestone notification
 */
export async function triggerStreakMilestone(
  supabase: SupabaseClient,
  userId: string,
  streakDays: number
): Promise<void> {
  const milestones = [7, 14, 30, 60, 90, 180, 365];

  if (!milestones.includes(streakDays)) return;

  const xpRewards: Record<number, number> = {
    7: 100,
    14: 200,
    30: 500,
    60: 1000,
    90: 1500,
    180: 3000,
    365: 10000,
  };

  await createNotification(supabase, userId, {
    type: 'achievement',
    title_tr: `${streakDays} Günlük Seri!`,
    title_en: `${streakDays} Day Streak!`,
    message_tr: `Tebrikler! ${streakDays} gün arka arkaya kullandınız ve ${xpRewards[streakDays]} XP kazandınız!`,
    message_en: `Congratulations! You've used the app for ${streakDays} consecutive days and earned ${xpRewards[streakDays]} XP!`,
    action_url: '/account',
    metadata: { streak_days: streakDays, xp_reward: xpRewards[streakDays] },
  });
}

/**
 * Trigger billing notification
 */
export async function triggerBillingNotification(
  supabase: SupabaseClient,
  userId: string,
  event: 'upgraded' | 'downgraded' | 'renewed' | 'payment_failed',
  planName?: string
): Promise<void> {
  switch (event) {
    case 'upgraded':
      await createNotification(supabase, userId, {
        type: 'success',
        title_tr: 'Plan Yükseltildi!',
        title_en: 'Plan Upgraded!',
        message_tr: `${planName || 'Pro'} planına başarıyla geçiş yaptınız. Yeni özelliklerin keyfini çıkarın!`,
        message_en: `Successfully upgraded to ${planName || 'Pro'} plan. Enjoy your new features!`,
        action_url: '/account',
      });
      break;

    case 'downgraded':
      await createNotification(supabase, userId, {
        type: 'info',
        title_tr: 'Plan Değiştirildi',
        title_en: 'Plan Changed',
        message_tr: 'Planınız değiştirildi. Yeni limitleriniz artık aktif.',
        message_en: 'Your plan has been changed. Your new limits are now active.',
        action_url: '/account',
      });
      break;

    case 'renewed':
      await createNotification(supabase, userId, {
        type: 'success',
        title_tr: 'Abonelik Yenilendi',
        title_en: 'Subscription Renewed',
        message_tr: 'Aboneliğiniz başarıyla yenilendi.',
        message_en: 'Your subscription has been successfully renewed.',
        action_url: '/account',
      });
      break;

    case 'payment_failed':
      await createNotification(supabase, userId, {
        type: 'warning',
        title_tr: 'Ödeme Başarısız',
        title_en: 'Payment Failed',
        message_tr: 'Ödemeniz işleme alınamadı. Lütfen ödeme bilgilerinizi güncelleyin.',
        message_en: 'Your payment could not be processed. Please update your payment information.',
        action_url: '/account',
      });
      break;
  }
}

/**
 * Trigger welcome notification for new users
 */
export async function triggerWelcomeNotification(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await createNotification(supabase, userId, {
    type: 'info',
    title_tr: 'ViralForge AI\'a Hoş Geldiniz!',
    title_en: 'Welcome to ViralForge AI!',
    message_tr: 'Viral içerikler oluşturmaya başlayın. İlk hook\'unuzu oluşturun!',
    message_en: 'Start creating viral content. Generate your first hook!',
    action_url: '/hooks',
  });
}

/**
 * Trigger weekly insights notification
 */
export async function triggerWeeklyInsights(
  supabase: SupabaseClient,
  userId: string,
  insights: { hooksGenerated: number; videosAnalyzed: number; topPerformingCategory?: string }
): Promise<void> {
  await createNotification(supabase, userId, {
    type: 'info',
    title_tr: 'Haftalık Özet',
    title_en: 'Weekly Summary',
    message_tr: `Bu hafta ${insights.hooksGenerated} hook oluşturdunuz ve ${insights.videosAnalyzed} video analiz ettiniz.`,
    message_en: `This week you generated ${insights.hooksGenerated} hooks and analyzed ${insights.videosAnalyzed} videos.`,
    action_url: '/account?tab=activity',
    metadata: insights,
  });
}
