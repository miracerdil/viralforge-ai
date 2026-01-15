import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getLatestInsights,
  generateWeeklyInsights,
  hasEnoughDataForInsights,
} from '@/lib/services/insights-engine';
import { getEffectiveEntitlements } from '@/lib/services/plan-resolver';
import { toInsightDisplay, type InsightsResponse } from '@/lib/types/insights';

/**
 * GET /api/insights
 * Fetch latest performance insights for the authenticated user
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

    const locale = request.nextUrl.searchParams.get('locale') || 'tr';

    // Check entitlements - full insights are PRO only
    const entitlements = await getEffectiveEntitlements(supabase, user.id);
    const canAccess = entitlements?.features.weekly_insights || false;

    // Check if user has enough data
    const dataCheck = await hasEnoughDataForInsights(supabase, user.id);

    // Get latest insights
    const insight = await getLatestInsights(supabase, user.id);

    const response: InsightsResponse = {
      insight,
      hasData: dataCheck.hasData,
      minimumResults: dataCheck.minimum,
      currentResults: dataCheck.count,
      canAccess,
    };

    // If user doesn't have access, redact detailed data
    if (!canAccess && insight) {
      response.insight = {
        ...insight,
        insights_json: {
          ...insight.insights_json,
          recommendations: insight.insights_json.recommendations.slice(0, 1),
          platform_comparison: [], // Hide detailed comparison
        },
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/insights
 * Generate new insights (admin/manual trigger)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const locale = (await request.json()).locale || 'tr';

    // Check entitlements
    const entitlements = await getEffectiveEntitlements(supabase, user.id);
    const canAccess = entitlements?.features.weekly_insights || false;

    if (!canAccess) {
      return NextResponse.json(
        {
          error: 'upgrade_required',
          message:
            locale === 'tr'
              ? 'Haftalık içgörüler için PRO planına yükseltin.'
              : 'Upgrade to PRO for weekly insights.',
        },
        { status: 403 }
      );
    }

    // Check data availability
    const dataCheck = await hasEnoughDataForInsights(supabase, user.id);

    if (!dataCheck.hasData) {
      return NextResponse.json(
        {
          error: 'insufficient_data',
          message:
            locale === 'tr'
              ? `İçgörüler için en az ${dataCheck.minimum} sonuç gerekli. Şu an ${dataCheck.count} sonucunuz var.`
              : `At least ${dataCheck.minimum} results needed for insights. You have ${dataCheck.count}.`,
          minimumResults: dataCheck.minimum,
          currentResults: dataCheck.count,
        },
        { status: 400 }
      );
    }

    // Generate insights
    const insight = await generateWeeklyInsights(supabase, {
      userId: user.id,
    });

    if (!insight) {
      return NextResponse.json(
        { error: 'Failed to generate insights' },
        { status: 500 }
      );
    }

    // Convert to display format
    const display = toInsightDisplay(insight, locale as 'tr' | 'en');

    return NextResponse.json({
      success: true,
      insight,
      display,
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
