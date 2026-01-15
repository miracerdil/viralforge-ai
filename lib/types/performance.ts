// Performance Tracking and Auto Optimization Types
import type { Platform } from './platform';
import type { CategoryGroupId } from './category';
import type { Tone, Goal } from './planner';

// Feature types for AI generation tracking
export type GenerationFeature = 'hooks' | 'planner' | 'abtest' | 'script';

// Content types for results
export type ContentType = 'hook' | 'plan' | 'abtest' | 'script';

// AI Generation record
export interface AIGeneration {
  id: string;
  user_id: string;
  feature: GenerationFeature;
  platform: Platform;
  category_group?: CategoryGroupId;
  category_slug?: string;
  tone?: Tone;
  goal?: Goal;
  persona_context?: Record<string, unknown>;
  prompt_hash?: string;
  output_preview?: string;
  output_count: number;
  generation_time_ms?: number;
  model_used: string;
  created_at: string;
}

// Input for creating a generation record
export interface AIGenerationInput {
  feature: GenerationFeature;
  platform: Platform;
  category_group?: CategoryGroupId;
  category_slug?: string;
  tone?: Tone;
  goal?: Goal;
  persona_context?: Record<string, unknown>;
  output_preview?: string;
  output_count?: number;
  generation_time_ms?: number;
  model_used?: string;
}

// Content result record
export interface ContentResult {
  id: string;
  user_id: string;
  generation_id?: string;
  platform: Platform;
  content_type: ContentType;
  content_preview?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followers_gained: number;
  engagement_rate?: number;
  posted_at?: string;
  created_at: string;
  updated_at: string;
}

// Input for creating/updating a content result
export interface ContentResultInput {
  generation_id?: string;
  platform: Platform;
  content_type: ContentType;
  content_preview?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  followers_gained?: number;
  posted_at?: string;
}

// Pattern statistics
export interface PatternStats {
  id: string;
  user_id: string;
  platform: Platform;
  category_group?: CategoryGroupId;
  category_slug?: string;
  tone?: Tone;
  goal?: Goal;
  pattern_key: string;
  total_generations: number;
  total_results: number;
  avg_views: number;
  avg_engagement_rate: number;
  weighted_score: number;
  best_performing_preview?: string;
  last_calculated_at: string;
  created_at: string;
}

// Performance bias for prompt injection
export interface PerformanceBias {
  platform: Platform;
  category_group?: CategoryGroupId;
  category_slug?: string;
  tone?: Tone;
  goal?: Goal;
  weighted_score: number;
  avg_engagement_rate: number;
  avg_views: number;
  best_performing_preview?: string;
  recommendation: string;
}

// Dashboard metrics summary
export interface PerformanceSummary {
  total_generations: number;
  total_results: number;
  avg_views: number;
  avg_engagement_rate: number;
  best_platform: Platform | null;
  best_tone: Tone | null;
  best_goal: Goal | null;
  top_patterns: PatternStats[];
  recent_results: ContentResult[];
}

// Generation with linked results for display
export interface GenerationWithResults extends AIGeneration {
  results: ContentResult[];
}
