import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasProAccess } from '@/lib/admin';
import type { LogPersonaEventRequest, PersonaEventType, PersonaEventMeta } from '@/lib/types/persona';

// POST /api/persona/events - Log a persona event
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Pro access (persona learning only for Pro)
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, comped_until')
      .eq('id', user.id)
      .single();

    const isPro = profile ? hasProAccess(profile.plan, profile.comped_until) : false;

    // Only log events for Pro users (persona learning is gated)
    if (!isPro) {
      return NextResponse.json({
        success: true,
        logged: false,
        reason: 'Persona learning requires Pro plan',
      });
    }

    const body: LogPersonaEventRequest = await request.json();
    const { event_type, meta, generation_id } = body;

    // Validate event type
    const validEventTypes: PersonaEventType[] = [
      'generation',
      'save',
      'export',
      'ab_test_win',
      'result_added',
      'onboarding',
    ];

    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Insert event log
    const { error } = await supabase.from('persona_event_logs').insert({
      user_id: user.id,
      event_type,
      meta: meta || {},
      generation_id: generation_id || null,
    });

    if (error) {
      console.error('Error logging persona event:', error);
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
    }

    // Trigger lightweight persona update for high-signal events
    if (['save', 'export', 'ab_test_win'].includes(event_type)) {
      await triggerPersonaUpdate(supabase, user.id);
    }

    return NextResponse.json({
      success: true,
      logged: true,
    });
  } catch (error) {
    console.error('Persona event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/persona/events - Get recent events for debugging (admin only)
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

    const { data: events, error } = await supabase
      .from('persona_event_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Events fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to trigger persona update
async function triggerPersonaUpdate(supabase: any, userId: string) {
  try {
    // Call the database function to update persona
    const { error } = await supabase.rpc('update_persona_from_events', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error updating persona:', error);
    }
  } catch (error) {
    console.error('Persona update trigger error:', error);
  }
}
