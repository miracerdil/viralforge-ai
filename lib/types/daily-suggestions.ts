/**
 * Daily Suggestions Types
 * Types for the daily content suggestions engine
 */

import type { Platform } from './platform';
import type { FormatType, ToneType } from './persona';

// Suggestion content structure stored in JSONB
export interface SuggestionContent {
  hook_idea: string;
  format: FormatType;
  tone: ToneType;
  cta: string;
  reason: string;
  pattern_key?: string;
  is_exploration: boolean;
  avg_engagement?: number;
  confidence_score?: number;
}

// Full daily suggestion record
export interface DailySuggestion {
  id: string;
  user_id: string;
  suggestion_date: string;
  platform: Platform;
  suggestion_json: SuggestionContent;
  used: boolean;
  used_at?: string;
  generation_id?: string;
  created_at: string;
}

// Input for generating suggestions
export interface GenerateSuggestionsInput {
  userId: string;
  platforms?: Platform[];
  count?: number; // 1 for FREE, 3 for PRO
  includeExploration?: boolean; // 30% exploration ratio
}

// Result of suggestion generation
export interface GenerateSuggestionsResult {
  suggestions: DailySuggestion[];
  patternsUsed: string[];
  explorationCount: number;
}

// Pattern data used for suggestion generation
export interface PatternData {
  pattern_key: string;
  platform: Platform;
  tone: ToneType;
  format?: FormatType;
  goal?: string;
  weighted_score: number;
  avg_engagement_rate: number;
  avg_views: number;
  total_results: number;
  best_performing_preview?: string;
}

// API response for daily suggestions
export interface DailySuggestionsResponse {
  suggestions: DailySuggestion[];
  hasMore: boolean;
  canGenerate: boolean; // Based on entitlements
  limit: number;
  used: number;
}

// Mark suggestion as used input
export interface MarkSuggestionUsedInput {
  suggestionId: string;
  generationId?: string;
}

// Suggestion display for UI
export interface SuggestionDisplay {
  id: string;
  platform: Platform;
  platformLabel: string;
  hookIdea: string;
  format: string;
  tone: string;
  cta: string;
  reason: string;
  isExploration: boolean;
  used: boolean;
  confidence?: number;
}

// Helper: Convert DB suggestion to display format
export function toSuggestionDisplay(
  suggestion: DailySuggestion,
  locale: 'tr' | 'en'
): SuggestionDisplay {
  const platformLabels: Record<Platform, string> = {
    tiktok: 'TikTok',
    instagram_reels: 'Instagram Reels',
    instagram_post: 'Instagram Post',
    youtube_shorts: 'YouTube Shorts',
  };

  const formatLabels: Record<FormatType, { tr: string; en: string }> = {
    listicle: { tr: 'Liste', en: 'Listicle' },
    story: { tr: 'Hikaye', en: 'Story' },
    tutorial: { tr: 'Eğitim', en: 'Tutorial' },
    reaction: { tr: 'Tepki', en: 'Reaction' },
    comparison: { tr: 'Karşılaştırma', en: 'Comparison' },
  };

  const toneLabels: Record<ToneType, { tr: string; en: string }> = {
    funny: { tr: 'Eğlenceli', en: 'Funny' },
    serious: { tr: 'Ciddi', en: 'Serious' },
    educational: { tr: 'Eğitici', en: 'Educational' },
    controversial: { tr: 'Tartışmalı', en: 'Controversial' },
    inspirational: { tr: 'İlham Verici', en: 'Inspirational' },
  };

  const content = suggestion.suggestion_json;

  return {
    id: suggestion.id,
    platform: suggestion.platform,
    platformLabel: platformLabels[suggestion.platform] || suggestion.platform,
    hookIdea: content.hook_idea,
    format: formatLabels[content.format]?.[locale] || content.format,
    tone: toneLabels[content.tone]?.[locale] || content.tone,
    cta: content.cta,
    reason: content.reason,
    isExploration: content.is_exploration,
    used: suggestion.used,
    confidence: content.confidence_score,
  };
}
