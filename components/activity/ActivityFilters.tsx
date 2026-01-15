'use client';

import { Sparkles, TrendingUp, CreditCard, Zap } from 'lucide-react';

export type ActivityCategory = 'all' | 'content' | 'growth' | 'billing' | 'xp';

interface ActivityFiltersProps {
  activeFilter: ActivityCategory;
  onFilterChange: (filter: ActivityCategory) => void;
  locale: string;
}

const categoryActions: Record<ActivityCategory, string[]> = {
  all: [],
  content: [
    'hook_generated',
    'video_analyzed',
    'planner_created',
    'ab_test_created',
    'ab_test_winner_selected',
    'hook_exported',
    'hook_shared',
    'share_created',
  ],
  growth: [
    'performance_result_added',
    'streak_achieved',
    'milestone_reached',
  ],
  billing: [
    'plan_upgraded',
    'plan_downgraded',
    'subscription_renewed',
  ],
  xp: [
    'xp_earned',
    'xp_spent',
    'reward_redeemed',
  ],
};

export function getActionsForCategory(category: ActivityCategory): string[] {
  return categoryActions[category];
}

const filters: { value: ActivityCategory; icon: React.ElementType }[] = [
  { value: 'all', icon: Sparkles },
  { value: 'content', icon: Sparkles },
  { value: 'growth', icon: TrendingUp },
  { value: 'billing', icon: CreditCard },
  { value: 'xp', icon: Zap },
];

const filterLabels: Record<ActivityCategory, { tr: string; en: string }> = {
  all: { tr: 'Tümü', en: 'All' },
  content: { tr: 'İçerik', en: 'Content' },
  growth: { tr: 'Büyüme', en: 'Growth' },
  billing: { tr: 'Fatura', en: 'Billing' },
  xp: { tr: 'XP', en: 'XP' },
};

export function ActivityFilters({ activeFilter, onFilterChange, locale }: ActivityFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.value;
        const label = filterLabels[filter.value][locale as 'tr' | 'en'];

        return (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${isActive
                ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
