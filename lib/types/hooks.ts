import type { Niche, Tone } from './planner';
import type { Platform } from './platform';
import type { CategoryGroupId } from './category';

export interface HookTemplate {
  id: string;
  locale: string;
  platform: Platform;
  niche: Niche;
  tone: Tone;
  hook_text: string;
  tags: string[] | null;
  is_generated: boolean;
  created_at: string;
}

export interface UserFavoriteHook {
  id: string;
  user_id: string;
  hook_id: string;
  created_at: string;
}

export interface HookWithFavorite extends HookTemplate {
  is_favorite: boolean;
}

export interface HooksFilterParams {
  locale: string;
  platform?: Platform;
  niche?: Niche;
  tone?: Tone;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface HooksResponse {
  hooks: HookWithFavorite[];
  total: number;
  has_more: boolean;
}

export interface FavoritesResponse {
  favorites: HookWithFavorite[];
  total: number;
}

export interface GenerateHooksRequest {
  platform: Platform;
  niche?: Niche;
  tone: Tone;
  goal: string;
  locale: string;
  categoryGroup?: CategoryGroupId;
  categorySlug?: string;
}

export interface GenerateHooksResponse {
  success: boolean;
  hooks?: HookTemplate[];
  error?: string;
}

// Plan limits
export const FREE_HOOKS_LIMIT = 20;
export const FREE_FAVORITES_LIMIT = 10;
export const FREE_WEEKLY_PLANS_LIMIT = 1;
export const GENERATE_HOOKS_COUNT = 5;
