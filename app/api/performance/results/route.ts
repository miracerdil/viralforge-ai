import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasProAccess } from '@/lib/admin';
import {
  addContentResult,
  getContentResults,
  recalculatePatternStats,
} from '@/lib/services/performance-tracking';
import type { ContentResultInput } from '@/lib/types/performance';

// GET - Fetch content results
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const generationId = searchParams.get('generation_id') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const results = await getContentResults(
      supabase,
      user.id,
      generationId,
      Math.min(limit, 100)
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}

// POST - Add a new content result (PRO+ only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has PRO access
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, comped_until')
      .eq('id', user.id)
      .single();

    const isPro = profile ? hasProAccess(profile.plan, profile.comped_until) : false;

    if (!isPro) {
      return NextResponse.json(
        { error: 'Performance tracking is a PRO feature' },
        { status: 403 }
      );
    }

    const body: ContentResultInput = await request.json();

    if (!body.platform || !body.content_type) {
      return NextResponse.json(
        { error: 'platform and content_type are required' },
        { status: 400 }
      );
    }

    const resultId = await addContentResult(supabase, user.id, body);

    if (!resultId) {
      return NextResponse.json({ error: 'Failed to add result' }, { status: 500 });
    }

    // Trigger pattern stats recalculation in background
    recalculatePatternStats(supabase, user.id).catch((err) =>
      console.error('Pattern stats recalculation failed:', err)
    );

    return NextResponse.json({ id: resultId });
  } catch (error) {
    console.error('Error adding result:', error);
    return NextResponse.json({ error: 'Failed to add result' }, { status: 500 });
  }
}
