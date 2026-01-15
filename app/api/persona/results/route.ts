import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasProAccess } from '@/lib/admin';
import type { AddContentResultRequest, ContentMetrics } from '@/lib/types/persona';

// POST /api/persona/results - Add content performance results
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Pro access
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, comped_until')
      .eq('id', user.id)
      .single();

    const isPro = profile ? hasProAccess(profile.plan, profile.comped_until) : false;

    if (!isPro) {
      return NextResponse.json({
        success: false,
        reason: 'Performance tracking requires Pro plan',
      }, { status: 403 });
    }

    const body: AddContentResultRequest = await request.json();
    const { generation_id, platform, metrics, content_meta } = body;

    if (!generation_id || !metrics) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate performance score
    const performance_score = calculatePerformanceScore(metrics);

    // Insert content result
    const { data, error } = await supabase
      .from('content_results')
      .insert({
        user_id: user.id,
        generation_id,
        platform: platform || 'tiktok',
        metrics,
        content_meta: content_meta || null,
        performance_score,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding result:', error);
      return NextResponse.json({ error: 'Failed to add result' }, { status: 500 });
    }

    // Log persona event
    await supabase.from('persona_event_logs').insert({
      user_id: user.id,
      event_type: 'result_added',
      meta: {
        ...content_meta,
        performance_score,
        platform,
      },
      generation_id,
    });

    // Trigger persona update
    await supabase.rpc('update_persona_from_events', {
      p_user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      result: data,
      performance_score,
    });
  } catch (error) {
    console.error('Content result error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/persona/results - Get user's content results
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const { data: results, error } = await supabase
      .from('content_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching results:', error);
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }

    // Calculate aggregate stats
    const avgScore = results.length > 0
      ? results.reduce((sum, r) => sum + (r.performance_score || 0), 0) / results.length
      : null;

    return NextResponse.json({
      results,
      stats: {
        total: results.length,
        avg_score: avgScore ? Math.round(avgScore * 100) / 100 : null,
      },
    });
  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate performance score
function calculatePerformanceScore(metrics: ContentMetrics): number {
  const views = metrics.views || 0;
  const likes = metrics.likes || 0;
  const comments = metrics.comments || 0;
  const saves = metrics.saves || 0;
  const shares = metrics.shares || 0;
  const completionRate = metrics.completion_rate || 0.5;

  if (views === 0) return 0;

  // Weighted engagement calculation
  const engagementScore = (
    (likes * 1.0 + comments * 3.0 + saves * 2.0 + shares * 4.0) / views * 100.0
  ) * completionRate * Math.min(Math.log10(views + 1) / 5.0, 2.0);

  return Math.min(Math.max(engagementScore, 0), 100);
}
