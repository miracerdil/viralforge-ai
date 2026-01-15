import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { markSuggestionUsed } from '@/lib/services/daily-suggestions';

/**
 * POST /api/daily-suggestions/use
 * Mark a suggestion as used
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
    const { suggestionId, generationId } = body;

    if (!suggestionId) {
      return NextResponse.json(
        { error: 'suggestionId is required' },
        { status: 400 }
      );
    }

    // Verify user owns this suggestion
    const { data: suggestion, error: fetchError } = await supabase
      .from('daily_suggestions')
      .select('user_id')
      .eq('id', suggestionId)
      .single();

    if (fetchError || !suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    if (suggestion.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Mark as used
    const success = await markSuggestionUsed(supabase, suggestionId, generationId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark suggestion as used' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Suggestion marked as used',
    });
  } catch (error) {
    console.error('Error marking suggestion as used:', error);
    return NextResponse.json(
      { error: 'Failed to mark suggestion as used' },
      { status: 500 }
    );
  }
}
