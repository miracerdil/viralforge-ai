// Re-export generated Supabase types
export type { Database, Tables, TablesInsert, TablesUpdate } from './supabase';

import type { Tables } from './supabase';
import type { Platform } from './platform';

// Type aliases for backward compatibility
export type Profile = Tables<'profiles'>;
export type Analysis = Tables<'analyses'>;
export type AnalysisFrame = Tables<'analysis_frames'>;
export type UsageDaily = Tables<'usage_daily'>;
export type ABTest = Tables<'ab_tests'>;

// Extended types
export interface AdminUserView extends Profile {
  analyses_count?: number;
  usage_today?: number;
}

// Enum types
export type Plan = 'FREE' | 'PRO';
export type Locale = 'tr' | 'en';
export type AnalysisStatus = 'queued' | 'processing' | 'done' | 'failed';

// Result types (not in DB, used for JSON columns)
export interface AnalysisResult {
  hook_score: number;
  retention_probability: number;
  viral_potential: number;
  engagement_score: number;
  content_type: string;
  key_issues: string[];
  recommended_hooks: string[];
  editing_instructions: EditingInstruction[];
  on_screen_text: string[];
  cover_suggestions: string[];
  caption_suggestions: string[];
}

export interface EditingInstruction {
  start_sec: number;
  end_sec: number;
  instruction: string;
}

export interface ABTestInput {
  option_a: string;
  option_b: string;
  type: 'hook' | 'caption' | 'cover';
}

export interface ABTestResult {
  winner: 'A' | 'B';
  reasoning: string;
  improvements: string[];
}
