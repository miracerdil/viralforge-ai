import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasProAccess } from '@/lib/admin';
import {
  updateContentResult,
  recalculatePatternStats,
} from '@/lib/services/performance-tracking';
import type { ContentResultInput } from '@/lib/types/performance';

// GET - Fetch a single result
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: result, error } = await supabase
      .from('content_results')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error fetching result:', error);
    return NextResponse.json({ error: 'Failed to fetch result' }, { status: 500 });
  }
}

// PUT - Update a result (PRO+ only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body: Partial<ContentResultInput> = await request.json();

    const success = await updateContentResult(supabase, user.id, id, body);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update result' }, { status: 500 });
    }

    // Trigger pattern stats recalculation in background
    recalculatePatternStats(supabase, user.id).catch((err) =>
      console.error('Pattern stats recalculation failed:', err)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating result:', error);
    return NextResponse.json({ error: 'Failed to update result' }, { status: 500 });
  }
}

// DELETE - Delete a result
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('content_results')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 });
    }

    // Trigger pattern stats recalculation in background
    recalculatePatternStats(supabase, user.id).catch((err) =>
      console.error('Pattern stats recalculation failed:', err)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting result:', error);
    return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 });
  }
}
