'use client';

import {
  Sparkles,
  Video,
  Calendar,
  FlaskConical,
  Gift,
  CreditCard,
  Zap,
  TrendingUp,
  Flame,
  Star,
  Download,
  Share2
} from 'lucide-react';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface Activity {
  id: string;
  action: string;
  action_label: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ActivityItemProps {
  activity: Activity;
  locale: string;
  dictionary: Dictionary;
}

const actionIcons: Record<string, React.ElementType> = {
  hook_generated: Sparkles,
  video_analyzed: Video,
  planner_created: Calendar,
  ab_test_created: FlaskConical,
  ab_test_winner_selected: FlaskConical,
  performance_result_added: TrendingUp,
  reward_redeemed: Gift,
  xp_earned: Zap,
  xp_spent: Zap,
  plan_upgraded: CreditCard,
  plan_downgraded: CreditCard,
  subscription_renewed: CreditCard,
  streak_achieved: Flame,
  milestone_reached: Star,
  hook_exported: Download,
  hook_shared: Share2,
  share_created: Share2,
};

const actionColors: Record<string, { bg: string; text: string }> = {
  hook_generated: { bg: 'bg-purple-100', text: 'text-purple-600' },
  video_analyzed: { bg: 'bg-blue-100', text: 'text-blue-600' },
  planner_created: { bg: 'bg-green-100', text: 'text-green-600' },
  ab_test_created: { bg: 'bg-amber-100', text: 'text-amber-600' },
  ab_test_winner_selected: { bg: 'bg-amber-100', text: 'text-amber-600' },
  performance_result_added: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
  reward_redeemed: { bg: 'bg-pink-100', text: 'text-pink-600' },
  xp_earned: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  xp_spent: { bg: 'bg-orange-100', text: 'text-orange-600' },
  plan_upgraded: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  plan_downgraded: { bg: 'bg-red-100', text: 'text-red-600' },
  subscription_renewed: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  streak_achieved: { bg: 'bg-orange-100', text: 'text-orange-600' },
  milestone_reached: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  hook_exported: { bg: 'bg-gray-100', text: 'text-gray-600' },
  hook_shared: { bg: 'bg-blue-100', text: 'text-blue-600' },
  share_created: { bg: 'bg-blue-100', text: 'text-blue-600' },
};

function getTimeAgo(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return locale === 'tr' ? 'Az önce' : 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return locale === 'tr'
      ? `${diffInMinutes} dakika önce`
      : `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return locale === 'tr'
      ? `${diffInHours} saat önce`
      : `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return locale === 'tr'
      ? `${diffInDays} gün önce`
      : `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function getActionLabel(action: string, locale: string): string {
  const labels: Record<string, { tr: string; en: string }> = {
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

  return labels[action]?.[locale as 'tr' | 'en'] || action;
}

export function ActivityItem({ activity, locale, dictionary }: ActivityItemProps) {
  const Icon = actionIcons[activity.action] || Zap;
  const colors = actionColors[activity.action] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  const label = activity.action_label || getActionLabel(activity.action, locale);
  const timeAgo = getTimeAgo(activity.created_at, locale);

  // Extract metadata details
  const metaDetails: string[] = [];
  if (activity.metadata) {
    if (activity.metadata.count) {
      metaDetails.push(`${activity.metadata.count} ${locale === 'tr' ? 'adet' : 'items'}`);
    }
    if (activity.metadata.platform) {
      metaDetails.push(activity.metadata.platform as string);
    }
    if (activity.metadata.xp_amount) {
      metaDetails.push(`${activity.metadata.xp_amount} XP`);
    }
    if (activity.metadata.plan) {
      metaDetails.push(activity.metadata.plan as string);
    }
  }

  return (
    <div className="flex items-start gap-4 py-4">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
        <Icon className={`w-5 h-5 ${colors.text}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{label}</p>
        {metaDetails.length > 0 && (
          <p className="text-sm text-gray-500 mt-0.5">
            {metaDetails.join(' • ')}
          </p>
        )}
      </div>

      {/* Time */}
      <span className="text-sm text-gray-400 flex-shrink-0">{timeAgo}</span>
    </div>
  );
}
