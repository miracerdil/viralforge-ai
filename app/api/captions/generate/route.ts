import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCaption, generateHashtags } from '@/lib/services/publishing';
import { canUseFeature, getEffectiveEntitlements } from '@/lib/services/plan-resolver';
import type { Platform } from '@/lib/types/platform';

/**
 * POST /api/captions/generate
 * Generate a caption for a hook
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
    const {
      hook,
      platform,
      locale = 'tr',
      tone,
      niche,
      includeStoryVersion = false,
      includeThreadVersion = false,
      hashtagsOnly = false,
    } = body;

    // Validate required fields
    if (!hook || !platform) {
      return NextResponse.json(
        { error: 'hook and platform are required' },
        { status: 400 }
      );
    }

    // Check usage limits
    const usageCheck = await canUseFeature(supabase, user.id, 'caption_generations');
    if (usageCheck.status === 'blocked') {
      return NextResponse.json(
        {
          error: 'limit_reached',
          message:
            locale === 'tr'
              ? 'Caption üretim limitine ulaştınız. Planınızı yükseltin.'
              : 'Caption generation limit reached. Upgrade your plan.',
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
          used: usageCheck.used,
        },
        { status: 429 }
      );
    }

    // If only hashtags requested
    if (hashtagsOnly) {
      const hashtags = await generateHashtags({
        platform: platform as Platform,
        niche: niche || 'genel',
        locale: locale as 'tr' | 'en',
        count: 15,
      });

      return NextResponse.json({
        success: true,
        hashtags,
      });
    }

    // Generate full caption
    const result = await generateCaption(supabase, user.id, {
      hook,
      platform: platform as Platform,
      locale: locale as 'tr' | 'en',
      tone,
      niche,
      includeStoryVersion,
      includeThreadVersion,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to generate caption' },
        { status: 500 }
      );
    }

    // Get updated usage info
    const entitlements = await getEffectiveEntitlements(supabase, user.id);
    const limit = entitlements?.limits.caption_generations || 3;

    return NextResponse.json({
      success: true,
      result,
      usage: {
        limit,
        remaining: usageCheck.remaining - 1,
      },
    });
  } catch (error) {
    console.error('Error generating caption:', error);
    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    );
  }
}
