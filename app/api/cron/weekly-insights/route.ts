import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateWeeklyInsights, hasEnoughDataForInsights } from '@/lib/services/insights-engine';

const CRON_SECRET = process.env.CRON_SECRET;

// Minimum content results needed for insights
const MIN_RESULTS = 3;

/**
 * POST /api/cron/weekly-insights
 * Cron job to generate weekly insights for all eligible PRO users
 * Should run every Monday at 8:00 AM
 *
 * Requires CRON_SECRET bearer token
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create admin Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all PRO users who should receive insights
    const { data: proUsers, error: usersError } = await supabase
      .from('user_subscriptions')
      .select('user_id, plan')
      .in('status', ['active', 'trialing'])
      .in('plan', ['creator_pro', 'business_pro']);

    if (usersError) {
      console.error('Error fetching PRO users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Also get comped users
    const { data: compedUsers, error: compedError } = await supabase
      .from('profiles')
      .select('id')
      .not('comped_until', 'is', null)
      .gte('comped_until', new Date().toISOString());

    if (compedError) {
      console.error('Error fetching comped users:', compedError);
    }

    // Combine user lists
    const userIds = new Set<string>();
    for (const user of proUsers || []) {
      userIds.add(user.user_id);
    }
    for (const user of compedUsers || []) {
      userIds.add(user.id);
    }

    const results = {
      total: userIds.size,
      generated: 0,
      skipped_no_data: 0,
      failed: 0,
    };

    // Generate insights for each user
    for (const userId of userIds) {
      try {
        // Check if user has enough data
        const dataCheck = await hasEnoughDataForInsights(supabase, userId);

        if (!dataCheck.hasData) {
          results.skipped_no_data++;
          continue;
        }

        // Generate insights
        const insight = await generateWeeklyInsights(supabase, {
          userId,
        });

        if (insight) {
          results.generated++;

          // TODO: Send email notification
          // await sendInsightsEmail(userId, insight);
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`Failed to generate insights for user ${userId}:`, error);
        results.failed++;
      }
    }

    console.log('Weekly insights cron completed:', results);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Weekly insights cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
