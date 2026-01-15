// Performance Tracking Service
// Server-side functions for tracking AI generations and content results

import { createHash } from 'crypto';
import type {
  AIGenerationInput,
  ContentResultInput,
  PerformanceBias,
  PerformanceSummary,
  PatternStats,
  GenerationFeature,
} from '@/lib/types/performance';
import type { Platform } from '@/lib/types/platform';
import type { CategoryGroupId } from '@/lib/types/category';
import type { Tone, Goal } from '@/lib/types/planner';

// Generate a hash for the prompt to detect duplicates
export function generatePromptHash(prompt: string): string {
  return createHash('md5').update(prompt).digest('hex');
}

// Generate pattern key for lookups
export function generatePatternKey(
  platform: Platform,
  categoryGroup?: CategoryGroupId,
  categorySlug?: string,
  tone?: Tone,
  goal?: Goal
): string {
  return [
    platform || 'any',
    categoryGroup || 'any',
    categorySlug || 'any',
    tone || 'any',
    goal || 'any',
  ].join(':');
}

// Track an AI generation
export async function trackGeneration(
  supabase: any,
  userId: string,
  input: AIGenerationInput
): Promise<string | null> {
  const { data, error } = await supabase
    .from('ai_generations')
    .insert({
      user_id: userId,
      feature: input.feature,
      platform: input.platform,
      category_group: input.category_group,
      category_slug: input.category_slug,
      tone: input.tone,
      goal: input.goal,
      persona_context: input.persona_context,
      output_preview: input.output_preview?.substring(0, 500),
      output_count: input.output_count || 1,
      generation_time_ms: input.generation_time_ms,
      model_used: input.model_used || 'gpt-4o-mini',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error tracking generation:', error);
    return null;
  }

  return data?.id || null;
}

// Add a content result
export async function addContentResult(
  supabase: any,
  userId: string,
  input: ContentResultInput
): Promise<string | null> {
  const { data, error } = await supabase
    .from('content_results')
    .insert({
      user_id: userId,
      generation_id: input.generation_id,
      platform: input.platform,
      content_type: input.content_type,
      content_preview: input.content_preview?.substring(0, 500),
      views: input.views || 0,
      likes: input.likes || 0,
      comments: input.comments || 0,
      shares: input.shares || 0,
      saves: input.saves || 0,
      followers_gained: input.followers_gained || 0,
      posted_at: input.posted_at,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error adding content result:', error);
    return null;
  }

  return data?.id || null;
}

// Update a content result
export async function updateContentResult(
  supabase: any,
  userId: string,
  resultId: string,
  input: Partial<ContentResultInput>
): Promise<boolean> {
  const { error } = await supabase
    .from('content_results')
    .update({
      views: input.views,
      likes: input.likes,
      comments: input.comments,
      shares: input.shares,
      saves: input.saves,
      followers_gained: input.followers_gained,
      posted_at: input.posted_at,
    })
    .eq('id', resultId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating content result:', error);
    return false;
  }

  return true;
}

// Get performance bias for a pattern (used in prompt injection)
export async function getPerformanceBias(
  supabase: any,
  userId: string,
  platform: Platform,
  categoryGroup?: CategoryGroupId,
  categorySlug?: string,
  tone?: Tone,
  goal?: Goal
): Promise<PerformanceBias | null> {
  const patternKey = generatePatternKey(platform, categoryGroup, categorySlug, tone, goal);

  // First try exact match
  let { data: stats } = await supabase
    .from('pattern_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('pattern_key', patternKey)
    .single();

  // If no exact match, try platform-only
  if (!stats) {
    const platformKey = generatePatternKey(platform);
    const { data: platformStats } = await supabase
      .from('pattern_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .order('weighted_score', { ascending: false })
      .limit(1)
      .single();
    stats = platformStats;
  }

  if (!stats || stats.total_results < 3) {
    return null; // Not enough data
  }

  // Generate recommendation based on stats
  let recommendation = '';
  if (stats.avg_engagement_rate > 5) {
    recommendation = `Bu kullanıcının ${platform} platformunda ortalama %${stats.avg_engagement_rate.toFixed(1)} etkileşim oranı var. En iyi performans gösteren içerik tarzını kullan.`;
  } else if (stats.avg_views > 1000) {
    recommendation = `Bu kullanıcı ${platform} platformunda ortalama ${Math.round(stats.avg_views)} izlenme alıyor. Daha dikkat çekici hook'lar kullan.`;
  }

  if (stats.best_performing_preview) {
    recommendation += ` En başarılı içerik örneği: "${stats.best_performing_preview.substring(0, 100)}..."`;
  }

  return {
    platform: stats.platform as Platform,
    category_group: stats.category_group as CategoryGroupId,
    category_slug: stats.category_slug,
    tone: stats.tone as Tone,
    goal: stats.goal as Goal,
    weighted_score: stats.weighted_score,
    avg_engagement_rate: stats.avg_engagement_rate,
    avg_views: stats.avg_views,
    best_performing_preview: stats.best_performing_preview,
    recommendation,
  };
}

// Get user's recent generations
export async function getRecentGenerations(
  supabase: any,
  userId: string,
  feature?: GenerationFeature,
  limit = 10
) {
  let query = supabase
    .from('ai_generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (feature) {
    query = query.eq('feature', feature);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching generations:', error);
    return [];
  }

  return data || [];
}

// Get user's content results
export async function getContentResults(
  supabase: any,
  userId: string,
  generationId?: string,
  limit = 20
) {
  let query = supabase
    .from('content_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (generationId) {
    query = query.eq('generation_id', generationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching content results:', error);
    return [];
  }

  return data || [];
}

// Get top performing patterns
export async function getTopPatterns(
  supabase: any,
  userId: string,
  platform?: Platform,
  limit = 5
): Promise<PatternStats[]> {
  let query = supabase
    .from('pattern_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('total_results', 3) // Only patterns with enough data
    .order('weighted_score', { ascending: false })
    .limit(limit);

  if (platform) {
    query = query.eq('platform', platform);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching top patterns:', error);
    return [];
  }

  return (data as PatternStats[]) || [];
}

// Get performance summary for dashboard
export async function getPerformanceSummary(
  supabase: any,
  userId: string
): Promise<PerformanceSummary> {
  // Get aggregate stats
  const [generationsResult, resultsResult, topPatterns, recentResults] = await Promise.all([
    supabase
      .from('ai_generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('content_results')
      .select('views, engagement_rate')
      .eq('user_id', userId),
    getTopPatterns(supabase, userId),
    getContentResults(supabase, userId, undefined, 5),
  ]);

  const totalGenerations = generationsResult.count || 0;
  const results = resultsResult.data || [];
  const totalResults = results.length;

  // Calculate averages
  const avgViews =
    totalResults > 0 ? results.reduce((sum, r) => sum + (r.views || 0), 0) / totalResults : 0;

  const avgEngagementRate =
    totalResults > 0
      ? results.reduce((sum, r) => sum + (r.engagement_rate || 0), 0) / totalResults
      : 0;

  // Find best performers from top patterns
  const bestPlatform = topPatterns[0]?.platform || null;
  const bestTone = topPatterns[0]?.tone || null;
  const bestGoal = topPatterns[0]?.goal || null;

  return {
    total_generations: totalGenerations,
    total_results: totalResults,
    avg_views: avgViews,
    avg_engagement_rate: avgEngagementRate,
    best_platform: bestPlatform as Platform | null,
    best_tone: bestTone as Tone | null,
    best_goal: bestGoal as Goal | null,
    top_patterns: topPatterns,
    recent_results: recentResults,
  };
}

// Trigger pattern stats recalculation (call after adding results)
export async function recalculatePatternStats(
  supabase: any,
  userId: string
): Promise<boolean> {
  const { error } = await supabase.rpc('recalculate_pattern_stats', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error recalculating pattern stats:', error);
    return false;
  }

  return true;
}
