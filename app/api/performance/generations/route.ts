import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackGeneration, getRecentGenerations } from '@/lib/services/performance-tracking';
import type { AIGenerationInput } from '@/lib/types/performance';

// GET - Fetch recent generations
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
    const feature = searchParams.get('feature') as AIGenerationInput['feature'] | null;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const generations = await getRecentGenerations(
      supabase,
      user.id,
      feature || undefined,
      Math.min(limit, 50)
    );

    return NextResponse.json({ generations });
  } catch (error) {
    console.error('Error fetching generations:', error);
    return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 });
  }
}

// POST - Track a new generation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AIGenerationInput = await request.json();

    if (!body.feature || !body.platform) {
      return NextResponse.json(
        { error: 'feature and platform are required' },
        { status: 400 }
      );
    }

    const generationId = await trackGeneration(supabase, user.id, body);

    if (!generationId) {
      return NextResponse.json({ error: 'Failed to track generation' }, { status: 500 });
    }

    return NextResponse.json({ id: generationId });
  } catch (error) {
    console.error('Error tracking generation:', error);
    return NextResponse.json({ error: 'Failed to track generation' }, { status: 500 });
  }
}
