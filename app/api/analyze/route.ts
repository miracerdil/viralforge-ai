import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeVideo } from '@/lib/openai/client';
import { checkAndIncrementQuota } from '@/lib/utils/quota';
import type { Locale } from '@/lib/i18n/config';
import type { Platform } from '@/lib/types/platform';
import type { CategoryGroupId } from '@/lib/types/category';
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

    const body = await request.json();
    const { analysisId, locale = 'tr', platform = 'tiktok', categoryGroup, categorySlug } = body as {
      analysisId: string;
      locale: Locale;
      platform?: Platform;
      categoryGroup?: CategoryGroupId;
      categorySlug?: string;
    };

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
    }

    // Fetch the analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Check quota
    const quota = await checkAndIncrementQuota(user.id);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'Daily quota exceeded. Upgrade to Pro for unlimited analyses.' },
        { status: 429 }
      );
    }

    // Update status to processing
    await supabase.from('analyses').update({ status: 'processing' }).eq('id', analysisId);

    // Fetch frames
    const { data: frames } = await supabase
      .from('analysis_frames')
      .select('frame_path')
      .eq('analysis_id', analysisId);

    // Get signed URLs for frames
    const frameUrls: string[] = [];
    if (frames && frames.length > 0) {
      for (const frame of frames) {
        const { data: signedUrl } = await supabase.storage
          .from('frames')
          .createSignedUrl(frame.frame_path, 3600);

        if (signedUrl?.signedUrl) {
          frameUrls.push(signedUrl.signedUrl);
        }
      }
    }

    // Call Claude for analysis
    try {
      // Get platform from analysis record (fallback to request or tiktok)
      const analysisPlatform = (analysis as unknown as { platform?: Platform }).platform || platform;
      // Get category from analysis record (fallback to request)
      const analysisData = analysis as unknown as { category_group?: CategoryGroupId; category_slug?: string };
      const analysisCategoryGroup = analysisData.category_group || categoryGroup || 'creator';
      const analysisCategorySlug = analysisData.category_slug || categorySlug || 'lifestyle';

      const result = await analyzeVideo({
        transcript: analysis.transcript,
        durationSec: analysis.duration_sec,
        frameUrls,
        locale: locale as Locale,
        platform: analysisPlatform,
        categoryGroup: analysisCategoryGroup,
        categorySlug: analysisCategorySlug,
      });

      // Save result
      await supabase
        .from('analyses')
        .update({
          result_json: result,
          status: 'done',
        })
        .eq('id', analysisId);

      // Log activity for user history
      await logActivityWithLocale(supabase, user.id, 'video_analyzed', locale, {
        entityType: 'analysis',
        entityId: analysisId,
        metadata: {
          platform: analysisPlatform,
          category: analysisCategorySlug,
          duration_sec: analysis.duration_sec,
          engagement_score: result.engagement_score,
        },
      });

      return NextResponse.json({ success: true, result });
    } catch (claudeError) {
      console.error('Claude analysis failed:', claudeError);

      // Update status to failed
      await supabase.from('analyses').update({ status: 'failed' }).eq('id', analysisId);

      return NextResponse.json(
        { error: 'Analysis failed. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
