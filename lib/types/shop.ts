export type XpLedgerType = 'earn' | 'spend';
export type RewardType = 'analysis_credit' | 'premium_hooks';

export interface ShopItem {
  id: string;
  is_active: boolean;
  xp_cost: number;
  reward_type: RewardType;
  reward_value: number;
  created_at: string;
}

export interface XpLedgerEntry {
  id: string;
  user_id: string;
  type: XpLedgerType;
  source: string;
  amount: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Redemption {
  id: string;
  user_id: string;
  item_id: string;
  xp_spent: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ShopStatus {
  xp_balance: number;
  premium_hooks_until: string | null;
  analysis_credit_balance: number;
  has_premium_hooks: boolean;
  premium_hooks_remaining_seconds: number | null;
}

export interface RedeemResult {
  success: boolean;
  new_xp_balance: number;
  new_analysis_credits: number;
  new_premium_hooks_until: string | null;
  error_message: string | null;
}

export interface ShopHistoryResponse {
  redemptions: Redemption[];
  ledger: XpLedgerEntry[];
  total_earned: number;
  total_spent: number;
}

// Item IDs as constants
export const SHOP_ITEM_IDS = {
  ANALYSIS_CREDIT_1: 'analysis_credit_1',
  PREMIUM_HOOKS_24H: 'premium_hooks_24h',
} as const;

export const SHOP_ITEM_COSTS = {
  [SHOP_ITEM_IDS.ANALYSIS_CREDIT_1]: 100,
  [SHOP_ITEM_IDS.PREMIUM_HOOKS_24H]: 150,
} as const;
