import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasProAccess } from '@/lib/admin';
import type { CreatorPersonaProfile, PersonaSummary } from '@/lib/types/persona';
import { getPersonaSummary, DEFAULT_PERSONA } from '@/lib/types/persona';

// GET /api/persona - Get user's persona profile
export async function GET(request: NextRequest) {
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

    // Get persona profile
    const { data: persona, error } = await supabase
      .from('creator_persona_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching persona:', error);
      return NextResponse.json({ error: 'Failed to fetch persona' }, { status: 500 });
    }

    // If no persona exists, return default
    if (!persona) {
      return NextResponse.json({
        persona: null,
        summary: null,
        isPro,
        hasPersona: false,
      });
    }

    // Build summary
    const summary = getPersonaSummary(persona as CreatorPersonaProfile);

    return NextResponse.json({
      persona: isPro ? persona : null, // Only return full persona for Pro users
      summary: isPro ? summary : null,
      isPro,
      hasPersona: true,
    });
  } catch (error) {
    console.error('Persona fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
