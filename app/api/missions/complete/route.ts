import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { mission_id } = body;

  if (!mission_id) {
    return NextResponse.json({ error: 'Mission ID required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Check if mission exists
  const { data: mission, error: missionError } = await supabase
    .from('daily_missions')
    .select('*')
    .eq('id', mission_id)
    .single();

  if (missionError || !mission) {
    return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
  }

  // Check if pro-only mission and user is not pro
  if (mission.is_pro_only) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, comped_until')
      .eq('id', user.id)
      .single();

    const normalizedPlan = (profile?.plan || 'free').toLowerCase();
    const isPro =
      normalizedPlan.includes('pro') || normalizedPlan === 'business' || (profile?.comped_until && profile.comped_until >= today);

    if (!isPro) {
      return NextResponse.json(
        { error: 'This mission is for Pro users only' },
        { status: 403 }
      );
    }
  }

  // Check if already completed today
  const { data: existingProgress } = await supabase
    .from('user_mission_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('mission_id', mission_id)
    .eq('date', today)
    .single();

  if (existingProgress?.completed) {
    return NextResponse.json({ error: 'Mission already completed today' }, { status: 400 });
  }

  // Create or update progress
  let progress;
  if (existingProgress) {
    const { data, error } = await supabase
      .from('user_mission_progress')
      .update({ completed: true })
      .eq('id', existingProgress.id)
      .select()
      .single();

    if (error) {
      console.error('Update progress error:', error);
      return NextResponse.json({ error: 'Failed to complete mission' }, { status: 500 });
    }
    progress = data;
  } else {
    const { data, error } = await supabase
      .from('user_mission_progress')
      .insert({
        user_id: user.id,
        mission_id,
        date: today,
        completed: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert progress error:', error);
      return NextResponse.json({ error: 'Failed to complete mission' }, { status: 500 });
    }
    progress = data;
  }

  // Award XP via the earn_xp RPC function
  const adminClient = createAdminClient();
  const xpAmount = mission.xp_reward || 10;

  const { error: xpError } = await adminClient.rpc('earn_xp', {
    p_user_id: user.id,
    p_amount: xpAmount,
    p_source: 'mission_complete',
    p_metadata: { mission_id: mission_id, mission_name: mission.title_en || mission.title_tr },
  });

  if (xpError) {
    console.error('XP award error:', xpError);
    // Don't fail the request, mission is already completed
  }

  // Get updated streak
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({ progress, streak, xp_earned: xpAmount });
}
