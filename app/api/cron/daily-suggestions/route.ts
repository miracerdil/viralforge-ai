import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDailySuggestions } from '@/lib/services/daily-suggestions';
import { PLAN_CONFIG } from '@/lib/config/plans';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/cron/daily-suggestions
 * Cron job to generate daily suggestions for all eligible users
 * Should run daily at 6:00 AM
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

    // Get all PRO users who should receive suggestions
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

    // Also add FREE users for basic suggestions (1 per day)
    const { data: freeUsers, error: freeError } = await supabase
      .from('profiles')
      .select('id')
      .limit(100); // Limit free users per batch

    if (!freeError && freeUsers) {
      for (const user of freeUsers) {
        userIds.add(user.id);
      }
    }

    const results = {
      total: userIds.size,
      success: 0,
      failed: 0,
      skipped: 0,
    };

    // Generate suggestions for each user
    for (const userId of userIds) {
      try {
        // Check user's plan for suggestion count
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('plan')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        const plan = subscription?.plan || 'free';
        const count = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG]?.limits.daily_suggestions || 1;

        const result = await generateDailySuggestions(supabase, {
          userId,
          count,
          includeExploration: plan !== 'free',
        });

        if (result.suggestions.length > 0) {
          results.success++;
        } else {
          results.skipped++;
        }
      } catch (error) {
        console.error(`Failed to generate suggestions for user ${userId}:`, error);
        results.failed++;
      }
    }

    console.log('Daily suggestions cron completed:', results);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Daily suggestions cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
