import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { predictABTest } from '@/lib/openai/client';
import type { Locale } from '@/lib/i18n/config';
import { canUseFeature, incrementUsageAndCheck } from '@/lib/services/plan-resolver';
import { logActivityWithLocale } from '@/lib/services/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check usage limits
    const usageCheck = await canUseFeature(supabase, user.id, 'ab_tests');

    if (usageCheck.status === 'blocked') {
      return NextResponse.json(
        {
          error: 'limit_reached',
          message: 'You have reached your A/B test limit.',
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
          used: usageCheck.used,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { optionA, optionB, type, locale = 'tr' } = body as {
      optionA: string;
      optionB: string;
      type: 'hook' | 'caption' | 'cover';
      locale: Locale;
    };

    if (!optionA || !optionB || !type) {
      return NextResponse.json(
        { error: 'Option A, Option B, and type are required' },
        { status: 400 }
      );
    }

    // Store the test input
    const { data: abTest, error: insertError } = await supabase
      .from('ab_tests')
      .insert({
        user_id: user.id,
        input_json: { option_a: optionA, option_b: optionB, type },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store A/B test:', insertError);
    }

    // Call Claude for prediction
    try {
      const result = await predictABTest({
        optionA,
        optionB,
        type,
        locale: locale as Locale,
      });

      // Update with result
      if (abTest) {
        await supabase
          .from('ab_tests')
          .update({ result_json: result })
          .eq('id', abTest.id);
      }

      // Increment usage counter
      await incrementUsageAndCheck(supabase, user.id, 'ab_tests', 1);

      // Log activity for user history
      await logActivityWithLocale(supabase, user.id, 'ab_test_created', locale, {
        entityType: 'ab_test',
        entityId: abTest?.id,
        metadata: {
          type,
          winner: result.winner,
          confidence: result.confidence,
        },
      });

      // Complete onboarding step if first A/B test
      try {
        await supabase.rpc('complete_onboarding_step', {
          p_user_id: user.id,
          p_step_key: 'complete_first_abtest',
        });
      } catch (e) {
        // Ignore if already completed
      }

      return NextResponse.json({ success: true, result });
    } catch (claudeError) {
      console.error('Claude A/B test failed:', claudeError);
      return NextResponse.json(
        { error: 'A/B test prediction failed. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('A/B test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
