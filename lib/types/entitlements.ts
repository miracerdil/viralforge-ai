// Entitlements and Usage Types

export type PlanType = 'free' | 'creator_pro' | 'business_pro';

export type FeatureType = 'hooks' | 'abtest' | 'planner' | 'brand_kits' | 'analyses';

export type UsageStatus = 'ok' | 'warning' | 'critical' | 'blocked';

export type LifecycleStage = 'new_user' | 'activated' | 'engaged' | 'at_risk' | 'churn_risk';

// Usage thresholds
export const USAGE_THRESHOLDS = {
  warning: 0.7,   // 70%
  critical: 0.9,  // 90%
  blocked: 1.0,   // 100%
} as const;

// Plan limits configuration
export const PLAN_LIMITS: Record<PlanType, Record<FeatureType, number>> = {
  free: {
    hooks: 10,
    abtest: 3,
    planner: 5,
    brand_kits: 0,
    analyses: 3,
  },
  creator_pro: {
    hooks: 100,
    abtest: 50,
    planner: 50,
    brand_kits: 1,
    analyses: 30,
  },
  business_pro: {
    hooks: 500,
    abtest: 200,
    planner: 200,
    brand_kits: 10,
    analyses: 100,
  },
};

// Plan features
export const PLAN_FEATURES: Record<PlanType, {
  persona_enabled: boolean;
  performance_tracking_enabled: boolean;
  priority_support: boolean;
  api_access: boolean;
}> = {
  free: {
    persona_enabled: false,
    performance_tracking_enabled: false,
    priority_support: false,
    api_access: false,
  },
  creator_pro: {
    persona_enabled: true,
    performance_tracking_enabled: true,
    priority_support: true,
    api_access: false,
  },
  business_pro: {
    persona_enabled: true,
    performance_tracking_enabled: true,
    priority_support: true,
    api_access: true,
  },
};

// User entitlements record
export interface UserEntitlements {
  id: string;
  user_id: string;
  plan: PlanType;

  // Usage counters
  hooks_used: number;
  hooks_limit: number;
  abtest_used: number;
  abtest_limit: number;
  planner_used: number;
  planner_limit: number;
  brand_kits_used: number;
  brand_kits_limit: number;
  analyses_used: number;
  analyses_limit: number;

  // Bonuses
  bonus_hooks: number;
  bonus_analyses: number;

  // Features
  persona_enabled: boolean;
  performance_tracking_enabled: boolean;

  usage_reset_at: string;
  created_at: string;
  updated_at: string;
}

// Usage info for a specific feature
export interface FeatureUsage {
  feature: FeatureType;
  used: number;
  limit: number;
  bonus: number;
  effectiveLimit: number;
  remaining: number;
  percentage: number;
  status: UsageStatus;
}

// Full usage summary
export interface UsageSummary {
  plan: PlanType;
  features: Record<FeatureType, FeatureUsage>;
  persona_enabled: boolean;
  performance_tracking_enabled: boolean;
  daysUntilReset: number;
}

// Upgrade message mapping
export const UPGRADE_MESSAGES: Record<FeatureType, { tr: string; en: string }> = {
  hooks: {
    tr: 'PRO ile sınırsız hook üret',
    en: 'Generate unlimited hooks with PRO',
  },
  abtest: {
    tr: 'Daha fazla A/B test için PRO\'ya geç',
    en: 'Upgrade to PRO for more A/B tests',
  },
  planner: {
    tr: 'Daha fazla içerik planı için PRO',
    en: 'Get more content plans with PRO',
  },
  brand_kits: {
    tr: 'Business plan ile çoklu marka yönet',
    en: 'Manage multiple brands with Business plan',
  },
  analyses: {
    tr: 'Daha fazla analiz için PRO\'ya geç',
    en: 'Upgrade to PRO for more analyses',
  },
};

// Lifecycle checklist
export interface LifecycleChecklist {
  first_generation: boolean;
  platform_picked: boolean;
  first_task: boolean;
}

// User lifecycle record
export interface UserLifecycle {
  id: string;
  user_id: string;
  stage: LifecycleStage;
  checklist_completed: LifecycleChecklist;
  last_activity_at: string;
  last_transition_at: string;
  streak_count: number;
  streak_last_date: string | null;
  weekly_active_days: number;
  created_at: string;
  updated_at: string;
}

// Lifecycle event types
export type LifecycleEventType =
  | 'signup_completed'
  | 'first_generation'
  | 'first_result_added'
  | 'ab_test_created'
  | 'streak_broken'
  | 'limit_hit'
  | 'upgrade_completed'
  | 'upgrade_prompt_shown'
  | 'upgrade_clicked'
  | 'feature_blocked'
  | 'checklist_item_completed'
  | 'stage_transition';

// Lifecycle event record
export interface LifecycleEvent {
  id: string;
  user_id: string;
  event_type: LifecycleEventType;
  feature?: string;
  meta: Record<string, unknown>;
  created_at: string;
}
