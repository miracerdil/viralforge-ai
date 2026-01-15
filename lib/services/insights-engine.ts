/**
 * Performance Insights Engine
 * Generates weekly performance insights with aggregation and AI summary
 */

import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Platform } from '@/lib/types/platform';
import type { ToneType, FormatType, CreatorPersonaProfile } from '@/lib/types/persona';
import type {
  PerformanceInsight,
  InsightContent,
  PlatformComparison,
  WeekOverWeekChange,
  BestPerformer,
  ContentResultData,
  AggregatedStats,
  GenerateInsightsInput,
} from '@/lib/types/insights';
import { getEffectiveEntitlements } from '@/lib/services/plan-resolver';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Minimum results needed for meaningful insights
const MIN_RESULTS_FOR_INSIGHTS = 3;

/**
 * Generate weekly performance insights for a user
 */
export async function generateWeeklyInsights(
  supabase: SupabaseClient,
  input: GenerateInsightsInput
): Promise<PerformanceInsight | null> {
  const { userId, periodStart, periodEnd } = input;

  // Calculate period dates (default to last week)
  const endDate = periodEnd || getLastSunday();
  const startDate = periodStart || getLastMonday(endDate);

  const periodStartStr = startDate.toISOString().split('T')[0];
  const periodEndStr = endDate.toISOString().split('T')[0];

  // Fetch content results for the period
  const results = await getContentResults(supabase, userId, startDate, endDate);

  if (results.length < MIN_RESULTS_FOR_INSIGHTS) {
    console.log(`Not enough results for insights: ${results.length} < ${MIN_RESULTS_FOR_INSIGHTS}`);
    return null;
  }

  // Fetch previous period for comparison
  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - 6);

  const prevResults = await getContentResults(supabase, userId, prevStart, prevEnd);

  // Calculate aggregations
  const platformStats = aggregateByPlatform(results);
  const toneStats = aggregateByTone(results);
  const formatStats = aggregateByFormat(results);
  const weekOverWeek = calculateWeekOverWeek(results, prevResults);

  // Find best performers
  const bestFormat = findBestPerformer(formatStats, 'format');
  const bestTone = findBestPerformer(toneStats, 'tone');
  const bestPlatform = findBestPlatform(platformStats);

  // Calculate totals
  const totalViews = results.reduce((sum, r) => sum + r.views, 0);
  const totalEngagement = results.reduce((sum, r) => sum + r.likes + r.comments + r.shares + r.saves, 0);
  const avgEngagementRate = results.reduce((sum, r) => sum + r.engagement_rate, 0) / results.length;

  // Generate platform comparison
  const platformComparison = buildPlatformComparison(platformStats, toneStats, formatStats);

  // Find best CTA (from top performing content)
  const topContent = [...results].sort((a, b) => b.engagement_rate - a.engagement_rate)[0];
  const bestCta = topContent?.goal || null;

  // Calculate persona alignment score
  const personaScore = await calculatePersonaAlignment(supabase, userId, results);

  // Generate recommendations
  const recommendations = generateRecommendations(
    weekOverWeek,
    bestFormat,
    bestTone,
    bestPlatform,
    platformComparison
  );

  // Generate AI summary
  const summary = await generateInsightSummary({
    totalContent: results.length,
    totalViews,
    avgEngagementRate,
    weekOverWeek,
    bestFormat,
    bestTone,
    bestPlatform,
    recommendations,
  });

  // Build insight content
  const insightContent: InsightContent = {
    summary,
    best_format: bestFormat,
    best_tone: bestTone,
    best_cta: bestCta,
    best_platform: bestPlatform,
    platform_comparison: platformComparison,
    week_over_week: weekOverWeek,
    recommendations,
    persona_alignment_score: personaScore,
    total_content: results.length,
    total_views: totalViews,
    total_engagement: totalEngagement,
    avg_engagement_rate: avgEngagementRate,
    top_performing_content: topContent?.content_type,
  };

  // Upsert into database
  const { data: insight, error } = await supabase
    .from('performance_insights')
    .upsert(
      {
        user_id: userId,
        period_start: periodStartStr,
        period_end: periodEndStr,
        insights_json: insightContent,
        email_sent: false,
      },
      {
        onConflict: 'user_id,period_start',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error inserting insight:', error);
    return null;
  }

  return {
    id: insight.id,
    user_id: insight.user_id,
    period_start: insight.period_start,
    period_end: insight.period_end,
    insights_json: insightContent,
    email_sent: insight.email_sent,
    email_sent_at: insight.email_sent_at,
    created_at: insight.created_at,
  };
}

/**
 * Get content results for a period
 */
async function getContentResults(
  supabase: SupabaseClient,
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ContentResultData[]> {
  // Join with ai_generations to get metadata
  const { data: results, error } = await supabase
    .from('content_results')
    .select(`
      id,
      platform,
      content_type,
      views,
      likes,
      comments,
      shares,
      saves,
      engagement_rate,
      posted_at,
      generation_id,
      ai_generations (
        tone,
        goal,
        category_slug
      )
    `)
    .eq('user_id', userId)
    .gte('posted_at', startDate.toISOString())
    .lte('posted_at', endDate.toISOString())
    .order('posted_at', { ascending: false });

  if (error || !results) {
    console.error('Error fetching results:', error);
    return [];
  }

  return results.map((r: any) => ({
    id: r.id,
    platform: r.platform as Platform,
    content_type: r.content_type,
    views: r.views || 0,
    likes: r.likes || 0,
    comments: r.comments || 0,
    shares: r.shares || 0,
    saves: r.saves || 0,
    engagement_rate: parseFloat(r.engagement_rate) || 0,
    posted_at: r.posted_at,
    tone: r.ai_generations?.tone as ToneType | undefined,
    format: r.ai_generations?.category_slug as FormatType | undefined,
    goal: r.ai_generations?.goal,
  }));
}

/**
 * Aggregate results by platform
 */
function aggregateByPlatform(results: ContentResultData[]): AggregatedStats[] {
  const groups = new Map<string, ContentResultData[]>();

  for (const r of results) {
    if (!groups.has(r.platform)) {
      groups.set(r.platform, []);
    }
    groups.get(r.platform)!.push(r);
  }

  return Array.from(groups.entries()).map(([platform, items]) => ({
    dimension: 'platform',
    value: platform,
    count: items.length,
    total_views: items.reduce((sum, i) => sum + i.views, 0),
    avg_views: items.reduce((sum, i) => sum + i.views, 0) / items.length,
    total_engagement: items.reduce((sum, i) => sum + i.likes + i.comments + i.shares + i.saves, 0),
    avg_engagement_rate: items.reduce((sum, i) => sum + i.engagement_rate, 0) / items.length,
  }));
}

/**
 * Aggregate results by tone
 */
function aggregateByTone(results: ContentResultData[]): AggregatedStats[] {
  const groups = new Map<string, ContentResultData[]>();

  for (const r of results) {
    if (r.tone) {
      if (!groups.has(r.tone)) {
        groups.set(r.tone, []);
      }
      groups.get(r.tone)!.push(r);
    }
  }

  return Array.from(groups.entries()).map(([tone, items]) => ({
    dimension: 'tone',
    value: tone,
    count: items.length,
    total_views: items.reduce((sum, i) => sum + i.views, 0),
    avg_views: items.reduce((sum, i) => sum + i.views, 0) / items.length,
    total_engagement: items.reduce((sum, i) => sum + i.likes + i.comments + i.shares + i.saves, 0),
    avg_engagement_rate: items.reduce((sum, i) => sum + i.engagement_rate, 0) / items.length,
  }));
}

/**
 * Aggregate results by format
 */
function aggregateByFormat(results: ContentResultData[]): AggregatedStats[] {
  const groups = new Map<string, ContentResultData[]>();

  for (const r of results) {
    if (r.format) {
      if (!groups.has(r.format)) {
        groups.set(r.format, []);
      }
      groups.get(r.format)!.push(r);
    }
  }

  return Array.from(groups.entries()).map(([format, items]) => ({
    dimension: 'format',
    value: format,
    count: items.length,
    total_views: items.reduce((sum, i) => sum + i.views, 0),
    avg_views: items.reduce((sum, i) => sum + i.views, 0) / items.length,
    total_engagement: items.reduce((sum, i) => sum + i.likes + i.comments + i.shares + i.saves, 0),
    avg_engagement_rate: items.reduce((sum, i) => sum + i.engagement_rate, 0) / items.length,
  }));
}

/**
 * Calculate week over week changes
 */
function calculateWeekOverWeek(
  current: ContentResultData[],
  previous: ContentResultData[]
): WeekOverWeekChange {
  const currentViews = current.reduce((sum, r) => sum + r.views, 0);
  const prevViews = previous.reduce((sum, r) => sum + r.views, 0);

  const currentEngagement = current.length > 0
    ? current.reduce((sum, r) => sum + r.engagement_rate, 0) / current.length
    : 0;
  const prevEngagement = previous.length > 0
    ? previous.reduce((sum, r) => sum + r.engagement_rate, 0) / previous.length
    : 0;

  const viewsChange = prevViews > 0 ? ((currentViews - prevViews) / prevViews) * 100 : 0;
  const engagementChange = prevEngagement > 0 ? ((currentEngagement - prevEngagement) / prevEngagement) * 100 : 0;

  return {
    views_change: Math.round(viewsChange * 10) / 10,
    engagement_change: Math.round(engagementChange * 10) / 10,
    content_count_change: current.length - previous.length,
  };
}

/**
 * Find best performer in a dimension
 */
function findBestPerformer(stats: AggregatedStats[], type: string): BestPerformer | null {
  if (stats.length === 0) return null;

  const best = stats.reduce((prev, curr) =>
    curr.avg_engagement_rate > prev.avg_engagement_rate ? curr : prev
  );

  return {
    type,
    value: best.value,
    avg_engagement: best.avg_engagement_rate,
    sample_count: best.count,
  };
}

/**
 * Find best performing platform
 */
function findBestPlatform(stats: AggregatedStats[]): Platform | null {
  if (stats.length === 0) return null;

  const best = stats.reduce((prev, curr) =>
    curr.avg_engagement_rate > prev.avg_engagement_rate ? curr : prev
  );

  return best.value as Platform;
}

/**
 * Build platform comparison data
 */
function buildPlatformComparison(
  platformStats: AggregatedStats[],
  toneStats: AggregatedStats[],
  formatStats: AggregatedStats[]
): PlatformComparison[] {
  return platformStats.map((stat) => ({
    platform: stat.value as Platform,
    total_content: stat.count,
    avg_views: stat.avg_views,
    avg_engagement_rate: stat.avg_engagement_rate,
    best_tone: toneStats.length > 0
      ? (toneStats.reduce((prev, curr) =>
          curr.avg_engagement_rate > prev.avg_engagement_rate ? curr : prev
        ).value as ToneType)
      : undefined,
    best_format: formatStats.length > 0
      ? (formatStats.reduce((prev, curr) =>
          curr.avg_engagement_rate > prev.avg_engagement_rate ? curr : prev
        ).value as FormatType)
      : undefined,
  }));
}

/**
 * Calculate persona alignment score
 */
async function calculatePersonaAlignment(
  supabase: SupabaseClient,
  userId: string,
  results: ContentResultData[]
): Promise<number> {
  // Fetch user's persona
  const { data: persona } = await supabase
    .from('creator_persona_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!persona || results.length === 0) return 0;

  const p = persona as CreatorPersonaProfile;

  // Calculate alignment based on how well results match persona preferences
  let alignmentScore = 0;
  let weightSum = 0;

  for (const result of results) {
    if (result.tone && p.tone_weights[result.tone]) {
      // Higher weight in persona = higher alignment when used
      alignmentScore += p.tone_weights[result.tone] * result.engagement_rate;
      weightSum += result.engagement_rate;
    }
  }

  if (weightSum === 0) return 50; // Neutral if no data

  // Normalize to 0-100
  const rawScore = alignmentScore / weightSum;
  return Math.min(100, Math.max(0, Math.round(rawScore * 100)));
}

/**
 * Generate recommendations based on data
 */
function generateRecommendations(
  weekOverWeek: WeekOverWeekChange,
  bestFormat: BestPerformer | null,
  bestTone: BestPerformer | null,
  bestPlatform: Platform | null,
  platformComparison: PlatformComparison[]
): string[] {
  const recommendations: string[] = [];

  // Views trend recommendation
  if (weekOverWeek.views_change < -10) {
    recommendations.push(
      'Görüntüleme sayın düşüş gösterdi. Daha trend konulara odaklanmayı dene.'
    );
  } else if (weekOverWeek.views_change > 20) {
    recommendations.push(
      'Harika performans! Bu haftaki stratejini sürdür.'
    );
  }

  // Format recommendation
  if (bestFormat && bestFormat.sample_count >= 2) {
    const formatNames: Record<string, string> = {
      listicle: 'Liste',
      story: 'Hikaye',
      tutorial: 'Eğitim',
      reaction: 'Tepki',
      comparison: 'Karşılaştırma',
    };
    recommendations.push(
      `${formatNames[bestFormat.value] || bestFormat.value} formatı %${bestFormat.avg_engagement.toFixed(1)} etkileşim oranı ile en iyi performansı gösteriyor. Daha fazla kullan!`
    );
  }

  // Tone recommendation
  if (bestTone && bestTone.sample_count >= 2) {
    const toneNames: Record<string, string> = {
      funny: 'Eğlenceli',
      serious: 'Ciddi',
      educational: 'Eğitici',
      controversial: 'Tartışmalı',
      inspirational: 'İlham verici',
    };
    recommendations.push(
      `${toneNames[bestTone.value] || bestTone.value} ton takipçilerinle rezonansa giriyor.`
    );
  }

  // Platform recommendation
  if (bestPlatform && platformComparison.length > 1) {
    const platformNames: Record<Platform, string> = {
      tiktok: 'TikTok',
      instagram_reels: 'Instagram Reels',
      instagram_post: 'Instagram Post',
      youtube_shorts: 'YouTube Shorts',
    };
    recommendations.push(
      `${platformNames[bestPlatform]} en iyi sonuçları veriyor. Orada daha aktif ol!`
    );
  }

  // Content count recommendation
  if (weekOverWeek.content_count_change < -2) {
    recommendations.push(
      'Bu hafta daha az içerik paylaştın. Düzenli paylaşım algoritma için önemli!'
    );
  }

  // Fallback
  if (recommendations.length === 0) {
    recommendations.push('Verilerini toplamaya devam et, önümüzdeki hafta daha detaylı analizler sunacağız.');
  }

  return recommendations.slice(0, 5); // Max 5 recommendations
}

/**
 * Generate AI summary of insights
 */
async function generateInsightSummary(data: {
  totalContent: number;
  totalViews: number;
  avgEngagementRate: number;
  weekOverWeek: WeekOverWeekChange;
  bestFormat: BestPerformer | null;
  bestTone: BestPerformer | null;
  bestPlatform: Platform | null;
  recommendations: string[];
}): Promise<string> {
  const viewsTrend = data.weekOverWeek.views_change > 0 ? 'arttı' : 'azaldı';
  const engagementTrend = data.weekOverWeek.engagement_change > 0 ? 'arttı' : 'azaldı';

  const prompt = `Bir içerik üreticisi için haftalık performans özeti yaz. Veriler:

- Toplam içerik: ${data.totalContent}
- Toplam görüntüleme: ${data.totalViews.toLocaleString('tr-TR')}
- Ortalama etkileşim: %${data.avgEngagementRate.toFixed(1)}
- Görüntüleme trendi: %${Math.abs(data.weekOverWeek.views_change).toFixed(1)} ${viewsTrend}
- Etkileşim trendi: %${Math.abs(data.weekOverWeek.engagement_change).toFixed(1)} ${engagementTrend}
${data.bestFormat ? `- En iyi format: ${data.bestFormat.value}` : ''}
${data.bestTone ? `- En iyi ton: ${data.bestTone.value}` : ''}
${data.bestPlatform ? `- En iyi platform: ${data.bestPlatform}` : ''}

2-3 cümlelik kısa, motive edici bir özet yaz. Türkçe yaz. Emojileri minimumda tut.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 200,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'Sen bir sosyal medya danışmanısın. Kısa, net ve motive edici özetler yazıyorsun.',
        },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0]?.message?.content?.trim() || 'Bu hafta performansın analiz edildi.';
  } catch (error) {
    console.error('Error generating summary:', error);
    return `Bu hafta ${data.totalContent} içerik paylaştın ve toplamda ${data.totalViews.toLocaleString('tr-TR')} görüntüleme aldın.`;
  }
}

/**
 * Get latest insights for a user
 */
export async function getLatestInsights(
  supabase: SupabaseClient,
  userId: string
): Promise<PerformanceInsight | null> {
  const { data: insight, error } = await supabase
    .from('performance_insights')
    .select('*')
    .eq('user_id', userId)
    .order('period_start', { ascending: false })
    .limit(1)
    .single();

  if (error || !insight) {
    return null;
  }

  return {
    id: insight.id,
    user_id: insight.user_id,
    period_start: insight.period_start,
    period_end: insight.period_end,
    insights_json: insight.insights_json as InsightContent,
    email_sent: insight.email_sent,
    email_sent_at: insight.email_sent_at,
    created_at: insight.created_at,
  };
}

/**
 * Check if user has enough data for insights
 */
export async function hasEnoughDataForInsights(
  supabase: SupabaseClient,
  userId: string
): Promise<{ hasData: boolean; count: number; minimum: number }> {
  const endDate = getLastSunday();
  const startDate = getLastMonday(endDate);

  const { count, error } = await supabase
    .from('content_results')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('posted_at', startDate.toISOString())
    .lte('posted_at', endDate.toISOString());

  const resultCount = count || 0;

  return {
    hasData: resultCount >= MIN_RESULTS_FOR_INSIGHTS,
    count: resultCount,
    minimum: MIN_RESULTS_FOR_INSIGHTS,
  };
}

// Helper: Get last Monday
function getLastMonday(fromDate?: Date): Date {
  const date = fromDate ? new Date(fromDate) : new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff - 7); // Previous week's Monday
  date.setHours(0, 0, 0, 0);
  return date;
}

// Helper: Get last Sunday
function getLastSunday(): Date {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day; // This week's Sunday
  date.setDate(diff);
  date.setHours(23, 59, 59, 999);
  return date;
}
