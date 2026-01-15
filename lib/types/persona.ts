// Creator Persona Modeling Types

export type ToneType = 'funny' | 'serious' | 'educational' | 'controversial' | 'inspirational';
export type OpeningType = 'question' | 'statement' | 'statistic' | 'story' | 'challenge';
export type FormatType = 'listicle' | 'story' | 'tutorial' | 'reaction' | 'comparison';
export type CTAStyle = 'soft' | 'direct' | 'urgent' | 'question';
export type PacingType = 'fast' | 'medium' | 'slow';

export type PersonaEventType =
  | 'generation'
  | 'save'
  | 'export'
  | 'ab_test_win'
  | 'result_added'
  | 'onboarding';

// Weights object type
export interface ToneWeights {
  funny: number;
  serious: number;
  educational: number;
  controversial: number;
  inspirational: number;
}

export interface OpeningBias {
  question: number;
  statement: number;
  statistic: number;
  story: number;
  challenge: number;
}

export interface FormatBias {
  listicle: number;
  story: number;
  tutorial: number;
  reaction: number;
  comparison: number;
}

// Main persona profile
export interface CreatorPersonaProfile {
  user_id: string;
  tone_weights: ToneWeights;
  opening_bias: OpeningBias;
  format_bias: FormatBias;
  cta_style: CTAStyle;
  avg_hook_length: number;
  pacing: PacingType;
  total_generations: number;
  total_saves: number;
  total_exports: number;
  total_ab_wins: number;
  avg_performance_score: number | null;
  best_performing_tone: ToneType | null;
  best_performing_opening: OpeningType | null;
  best_performing_format: FormatType | null;
  onboarding_answers: OnboardingAnswers | null;
  created_at: string;
  last_updated_at: string;
}

// Event log entry
export interface PersonaEventLog {
  id: string;
  user_id: string;
  event_type: PersonaEventType;
  meta: PersonaEventMeta;
  generation_id: string | null;
  created_at: string;
}

// Event metadata
export interface PersonaEventMeta {
  tone?: ToneType;
  opening_type?: OpeningType;
  format?: FormatType;
  cta_style?: CTAStyle;
  hook_length?: number;
  platform?: string;
  generation_id?: string;
  content_snippet?: string;
  [key: string]: unknown;
}

// Content results with metrics
export interface ContentResult {
  id: string;
  user_id: string;
  generation_id: string;
  platform: string;
  metrics: ContentMetrics;
  content_meta: PersonaEventMeta | null;
  performance_score: number | null;
  created_at: string;
}

export interface ContentMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  saves?: number;
  shares?: number;
  completion_rate?: number;
  engagement_rate?: number;
}

// Onboarding answers for initial seeding
export interface OnboardingAnswers {
  preferred_tone?: ToneType;
  content_style?: 'fast_paced' | 'slow_detailed' | 'balanced';
  cta_preference?: CTAStyle;
  hook_style?: 'short_punchy' | 'long_detailed' | 'balanced';
  target_audience?: string;
  niche?: string;
}

// API request/response types
export interface LogPersonaEventRequest {
  event_type: PersonaEventType;
  meta: PersonaEventMeta;
  generation_id?: string;
}

export interface AddContentResultRequest {
  generation_id: string;
  platform: string;
  metrics: ContentMetrics;
  content_meta?: PersonaEventMeta;
}

export interface PersonaSummary {
  dominant_tone: ToneType;
  dominant_tone_percentage: number;
  best_performing_format: FormatType | null;
  typical_hook_length: number;
  cta_style: CTAStyle;
  pacing: PacingType;
  total_content_generated: number;
  save_rate: number; // saves / generations
  has_enough_data: boolean;
}

// Persona overlay for AI prompts
export interface PersonaOverlay {
  enabled: boolean;
  tone_preference: ToneType;
  tone_strength: number; // 0-1, how strongly to apply
  opening_preference: OpeningType;
  format_preference: FormatType;
  cta_style: CTAStyle;
  target_hook_length: number;
  pacing: PacingType;
  performance_insights: {
    best_tone: ToneType | null;
    best_format: FormatType | null;
    avg_score: number | null;
  };
}

// Default persona for new users
export const DEFAULT_PERSONA: Omit<CreatorPersonaProfile, 'user_id' | 'created_at' | 'last_updated_at'> = {
  tone_weights: {
    funny: 0.2,
    serious: 0.2,
    educational: 0.2,
    controversial: 0.2,
    inspirational: 0.2,
  },
  opening_bias: {
    question: 0.2,
    statement: 0.2,
    statistic: 0.2,
    story: 0.2,
    challenge: 0.2,
  },
  format_bias: {
    listicle: 0.2,
    story: 0.2,
    tutorial: 0.2,
    reaction: 0.2,
    comparison: 0.2,
  },
  cta_style: 'soft',
  avg_hook_length: 12,
  pacing: 'medium',
  total_generations: 0,
  total_saves: 0,
  total_exports: 0,
  total_ab_wins: 0,
  avg_performance_score: null,
  best_performing_tone: null,
  best_performing_opening: null,
  best_performing_format: null,
  onboarding_answers: null,
};

// Helper functions
export function getDominantTone(weights: ToneWeights): ToneType {
  const entries = Object.entries(weights) as [ToneType, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

export function getDominantOpening(bias: OpeningBias): OpeningType {
  const entries = Object.entries(bias) as [OpeningType, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

export function getDominantFormat(bias: FormatBias): FormatType {
  const entries = Object.entries(bias) as [FormatType, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

export function buildPersonaOverlay(
  persona: CreatorPersonaProfile | null,
  isPro: boolean
): PersonaOverlay {
  if (!persona || !isPro) {
    return {
      enabled: false,
      tone_preference: 'educational',
      tone_strength: 0,
      opening_preference: 'question',
      format_preference: 'listicle',
      cta_style: 'soft',
      target_hook_length: 12,
      pacing: 'medium',
      performance_insights: {
        best_tone: null,
        best_format: null,
        avg_score: null,
      },
    };
  }

  const dominantTone = getDominantTone(persona.tone_weights);
  const dominantOpening = getDominantOpening(persona.opening_bias);
  const dominantFormat = getDominantFormat(persona.format_bias);

  return {
    enabled: true,
    tone_preference: dominantTone,
    tone_strength: persona.tone_weights[dominantTone],
    opening_preference: dominantOpening,
    format_preference: dominantFormat,
    cta_style: persona.cta_style,
    target_hook_length: persona.avg_hook_length,
    pacing: persona.pacing,
    performance_insights: {
      best_tone: persona.best_performing_tone,
      best_format: persona.best_performing_format,
      avg_score: persona.avg_performance_score,
    },
  };
}

export function getPersonaSummary(persona: CreatorPersonaProfile): PersonaSummary {
  const dominantTone = getDominantTone(persona.tone_weights);

  return {
    dominant_tone: dominantTone,
    dominant_tone_percentage: Math.round(persona.tone_weights[dominantTone] * 100),
    best_performing_format: persona.best_performing_format,
    typical_hook_length: persona.avg_hook_length,
    cta_style: persona.cta_style,
    pacing: persona.pacing,
    total_content_generated: persona.total_generations,
    save_rate: persona.total_generations > 0
      ? Math.round((persona.total_saves / persona.total_generations) * 100) / 100
      : 0,
    has_enough_data: persona.total_saves >= 5,
  };
}
