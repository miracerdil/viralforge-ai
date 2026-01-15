import type { Platform } from './platform';
import type { CategoryGroupId } from './category';

export type Niche =
  | 'fitness'
  | 'beauty'
  | 'ecommerce'
  | 'education'
  | 'motivation'
  | 'food'
  | 'travel'
  | 'gaming'
  | 'general';

export type Goal = 'views' | 'followers' | 'engagement' | 'sales';

export type Tone = 'funny' | 'serious' | 'educational' | 'controversial' | 'inspirational';

export type Frequency = 3 | 5 | 7;

export interface PlannerRequest {
  id: string;
  user_id: string;
  locale: string;
  platform: Platform;
  niche: Niche;
  goal: Goal;
  audience: string | null;
  tone: Tone | null;
  frequency: number;
  created_at: string;
}

export interface PlanItem {
  day_index: number;
  title: string;
  hook: string;
  script_outline: string[];
  shot_list: string[];
  on_screen_text: string[];
  cta: string;
  hashtags: string[];
  estimated_duration_seconds: number;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  request_id: string;
  locale: string;
  platform: Platform;
  plan_json: PlanItem[];
  created_at: string;
}

export interface PlannerFormData {
  platform: Platform;
  niche?: Niche;
  goal: Goal;
  audience?: string;
  tone?: Tone;
  frequency: Frequency;
  categoryGroup?: CategoryGroupId;
  categorySlug?: string;
}

export interface GeneratePlanRequest {
  platform: Platform;
  niche?: Niche;
  goal: Goal;
  audience?: string;
  tone?: Tone;
  frequency?: number;
  locale: string;
  categoryGroup?: CategoryGroupId;
  categorySlug?: string;
}

export interface GeneratePlanResponse {
  success: boolean;
  plan?: WeeklyPlan;
  error?: string;
}

export const NICHES: Niche[] = [
  'fitness',
  'beauty',
  'ecommerce',
  'education',
  'motivation',
  'food',
  'travel',
  'gaming',
  'general',
];

export const GOALS: Goal[] = ['views', 'followers', 'engagement', 'sales'];

export const TONES: Tone[] = ['funny', 'serious', 'educational', 'controversial', 'inspirational'];

export const FREQUENCIES: Frequency[] = [3, 5, 7];
