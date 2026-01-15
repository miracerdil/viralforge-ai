import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPerformanceBias } from '@/lib/services/performance-tracking';
import type { Platform } from '@/lib/types/platform';
import type { CategoryGroupId } from '@/lib/types/category';
import type { Tone, Goal } from '@/lib/types/planner';

// GET - Get performance bias for prompt injection
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
    const platform = searchParams.get('platform') as Platform;
    const categoryGroup = searchParams.get('category_group') as CategoryGroupId | null;
    const categorySlug = searchParams.get('category_slug') || undefined;
    const tone = searchParams.get('tone') as Tone | null;
    const goal = searchParams.get('goal') as Goal | null;

    if (!platform) {
      return NextResponse.json({ error: 'platform is required' }, { status: 400 });
    }

    const bias = await getPerformanceBias(
      supabase,
      user.id,
      platform,
      categoryGroup || undefined,
      categorySlug,
      tone || undefined,
      goal || undefined
    );

    return NextResponse.json({ bias });
  } catch (error) {
    console.error('Error fetching bias:', error);
    return NextResponse.json({ error: 'Failed to fetch bias' }, { status: 500 });
  }
}
