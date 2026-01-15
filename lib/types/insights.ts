/**
 * Performance Insights Types
 * Types for the weekly performance insights engine
 */

import type { Platform } from './platform';
import type { FormatType, ToneType } from './persona';

// Platform comparison data
export interface PlatformComparison {
  platform: Platform;
  total_content: number;
  avg_views: number;
  avg_engagement_rate: number;
  best_tone?: ToneType;
  best_format?: FormatType;
}

// Week over week comparison
export interface WeekOverWeekChange {
  views_change: number; // percentage change
  engagement_change: number; // percentage change
  content_count_change: number;
}

// Best performer data
export interface BestPerformer {
  type: string; // format, tone, etc.
  value: string;
  avg_engagement: number;
  sample_count: number;
}

// Full insights content stored in JSONB
export interface InsightContent {
  summary: string; // AI-generated human readable summary
  best_format: BestPerformer | null;
  best_tone: BestPerformer | null;
  best_cta: string | null;
  best_platform: Platform | null;
  platform_comparison: PlatformComparison[];
  week_over_week: WeekOverWeekChange;
  recommendations: string[];
  persona_alignment_score: number; // 0-100
  total_content: number;
  total_views: number;
  total_engagement: number;
  avg_engagement_rate: number;
  top_performing_content?: string; // preview of best content
}

// Full performance insight record
export interface PerformanceInsight {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  insights_json: InsightContent;
  email_sent: boolean;
  email_sent_at?: string;
  created_at: string;
}

// Input for generating insights
export interface GenerateInsightsInput {
  userId: string;
  periodStart?: Date; // defaults to last Monday
  periodEnd?: Date; // defaults to last Sunday
}

// Raw content result data for aggregation
export interface ContentResultData {
  id: string;
  platform: Platform;
  content_type: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number;
  posted_at: string;
  tone?: ToneType;
  format?: FormatType;
  goal?: string;
}

// Aggregated stats by dimension
export interface AggregatedStats {
  dimension: string; // platform, tone, format
  value: string;
  count: number;
  total_views: number;
  avg_views: number;
  total_engagement: number;
  avg_engagement_rate: number;
}

// API response for insights
export interface InsightsResponse {
  insight: PerformanceInsight | null;
  hasData: boolean;
  minimumResults: number; // minimum results needed
  currentResults: number;
  canAccess: boolean; // PRO only for full insights
}

// Dashboard summary (lighter version for quick display)
export interface InsightsSummary {
  hasInsights: boolean;
  periodLabel: string;
  totalContent: number;
  totalViews: number;
  avgEngagement: number;
  viewsChange: number; // percentage
  engagementChange: number; // percentage
  bestPlatform?: string;
  bestTone?: string;
  topRecommendation?: string;
}

// Insight display for UI
export interface InsightDisplay {
  id: string;
  periodLabel: string;
  summary: string;
  highlights: InsightHighlight[];
  recommendations: string[];
  trends: InsightTrend[];
}

export interface InsightHighlight {
  label: string;
  value: string | number;
  subtext?: string;
  isPositive?: boolean;
}

export interface InsightTrend {
  metric: string;
  change: number;
  direction: 'up' | 'down' | 'stable';
}

// Helper: Format period label
export function formatPeriodLabel(
  periodStart: string,
  periodEnd: string,
  locale: 'tr' | 'en'
): string {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  const startStr = start.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', options);
  const endStr = end.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', options);

  return `${startStr} - ${endStr}`;
}

// Helper: Get trend direction
export function getTrendDirection(change: number): 'up' | 'down' | 'stable' {
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

// Helper: Format percentage change
export function formatChange(change: number, locale: 'tr' | 'en'): string {
  const prefix = change > 0 ? '+' : '';
  const suffix = locale === 'tr' ? '%' : '%';
  return `${prefix}${change.toFixed(1)}${suffix}`;
}

// Helper: Convert insight to display format
export function toInsightDisplay(
  insight: PerformanceInsight,
  locale: 'tr' | 'en'
): InsightDisplay {
  const content = insight.insights_json;
  const periodLabel = formatPeriodLabel(insight.period_start, insight.period_end, locale);

  const highlights: InsightHighlight[] = [
    {
      label: locale === 'tr' ? 'Toplam Görüntüleme' : 'Total Views',
      value: content.total_views.toLocaleString(),
      subtext: formatChange(content.week_over_week.views_change, locale),
      isPositive: content.week_over_week.views_change > 0,
    },
    {
      label: locale === 'tr' ? 'Ortalama Etkileşim' : 'Avg Engagement',
      value: `${content.avg_engagement_rate.toFixed(1)}%`,
      subtext: formatChange(content.week_over_week.engagement_change, locale),
      isPositive: content.week_over_week.engagement_change > 0,
    },
    {
      label: locale === 'tr' ? 'İçerik Sayısı' : 'Content Count',
      value: content.total_content,
    },
  ];

  if (content.best_platform) {
    highlights.push({
      label: locale === 'tr' ? 'En İyi Platform' : 'Best Platform',
      value: content.best_platform,
    });
  }

  const trends: InsightTrend[] = [
    {
      metric: locale === 'tr' ? 'Görüntüleme' : 'Views',
      change: content.week_over_week.views_change,
      direction: getTrendDirection(content.week_over_week.views_change),
    },
    {
      metric: locale === 'tr' ? 'Etkileşim' : 'Engagement',
      change: content.week_over_week.engagement_change,
      direction: getTrendDirection(content.week_over_week.engagement_change),
    },
  ];

  return {
    id: insight.id,
    periodLabel,
    summary: content.summary,
    highlights,
    recommendations: content.recommendations,
    trends,
  };
}
