import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLatestInsights, hasEnoughDataForInsights } from '@/lib/services/insights-engine';
import { getEffectiveEntitlements } from '@/lib/services/plan-resolver';
import { formatPeriodLabel, type InsightsSummary } from '@/lib/types/insights';

/**
 * GET /api/insights/summary
 * Quick dashboard summary - available for all users (limited for FREE)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const locale = (request.nextUrl.searchParams.get('locale') || 'tr') as 'tr' | 'en';

    // Check data availability
    const dataCheck = await hasEnoughDataForInsights(supabase, user.id);

    // Get latest insights
    const insight = await getLatestInsights(supabase, user.id);

    // Build summary
    const summary: InsightsSummary = {
      hasInsights: !!insight && dataCheck.hasData,
      periodLabel: insight
        ? formatPeriodLabel(insight.period_start, insight.period_end, locale)
        : '',
      totalContent: insight?.insights_json.total_content || 0,
      totalViews: insight?.insights_json.total_views || 0,
      avgEngagement: insight?.insights_json.avg_engagement_rate || 0,
      viewsChange: insight?.insights_json.week_over_week.views_change || 0,
      engagementChange: insight?.insights_json.week_over_week.engagement_change || 0,
      bestPlatform: insight?.insights_json.best_platform || undefined,
      bestTone: insight?.insights_json.best_tone?.value || undefined,
      topRecommendation: insight?.insights_json.recommendations[0] || undefined,
    };

    // Check if user has PRO access for detailed data
    const entitlements = await getEffectiveEntitlements(supabase, user.id);
    const isPro = entitlements?.features.weekly_insights || false;

    return NextResponse.json({
      success: true,
      summary,
      isPro,
      hasData: dataCheck.hasData,
      minimumResults: dataCheck.minimum,
      currentResults: dataCheck.count,
    });
  } catch (error) {
    console.error('Error fetching insights summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights summary' },
      { status: 500 }
    );
  }
}
