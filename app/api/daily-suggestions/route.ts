import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateDailySuggestions,
  getTodaySuggestions,
  canGenerateSuggestions,
} from '@/lib/services/daily-suggestions';
import { getEffectiveEntitlements } from '@/lib/services/plan-resolver';
import { toSuggestionDisplay } from '@/lib/types/daily-suggestions';

/**
 * GET /api/daily-suggestions
 * Fetch today's suggestions for the authenticated user
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

    // Get today's suggestions
    const suggestions = await getTodaySuggestions(supabase, user.id);

    // Get entitlements for limit info
    const entitlements = await getEffectiveEntitlements(supabase, user.id);
    const limit = entitlements?.limits.daily_suggestions || 1;

    // Convert to display format
    const displaySuggestions = suggestions.map((s) =>
      toSuggestionDisplay(s, locale as 'tr' | 'en')
    );

    return NextResponse.json({
      success: true,
      suggestions: displaySuggestions,
      limit,
      used: suggestions.filter((s) => s.used).length,
      canGenerate: suggestions.length < limit,
    });
  } catch (error) {
    console.error('Error fetching daily suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daily-suggestions
 * Generate new suggestions for today
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

    const body = await request.json();
    const { platforms, locale = 'tr', force = false } = body;

    // Check if user can generate suggestions
    const canGenerate = await canGenerateSuggestions(supabase, user.id);

    if (!canGenerate.can && !force) {
      return NextResponse.json(
        {
          error: 'limit_reached',
          message: canGenerate.reason,
          existingCount: canGenerate.existingCount,
        },
        { status: 429 }
      );
    }

    // Get entitlements for count
    const entitlements = await getEffectiveEntitlements(supabase, user.id);
    const count = entitlements?.limits.daily_suggestions || 1;

    // Generate suggestions
    const result = await generateDailySuggestions(supabase, {
      userId: user.id,
      platforms,
      count,
      includeExploration: true,
    });

    // Convert to display format
    const displaySuggestions = result.suggestions.map((s) =>
      toSuggestionDisplay(s, locale as 'tr' | 'en')
    );

    return NextResponse.json({
      success: true,
      suggestions: displaySuggestions,
      patternsUsed: result.patternsUsed,
      explorationCount: result.explorationCount,
    });
  } catch (error) {
    console.error('Error generating daily suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
