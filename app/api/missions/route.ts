import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'tr';
  const niche = searchParams.get('niche') || 'general';

  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile to check if PRO
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, comped_until')
    .eq('id', user.id)
    .single();

  const today = new Date().toISOString().split('T')[0];
  const normalizedPlan = (profile?.plan || 'free').toLowerCase();
  const isPro =
    normalizedPlan.includes('pro') || normalizedPlan === 'business' || (profile?.comped_until && profile.comped_until >= today);

  // Get today's mission for the user's niche and locale
  // Rotate based on day of year for variety
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );

  const { data: missions, error: missionsError } = await supabase
    .from('daily_missions')
    .select('*')
    .eq('locale', locale)
    .or(`niche.eq.${niche},niche.eq.general`)
    .order('created_at', { ascending: true });

  if (missionsError || !missions || missions.length === 0) {
    return NextResponse.json({ mission: null, progress: null, streak: null });
  }

  // Filter out pro-only missions for free users
  const availableMissions = isPro
    ? missions
    : missions.filter((m) => !m.is_pro_only);

  if (availableMissions.length === 0) {
    return NextResponse.json({ mission: null, progress: null, streak: null });
  }

  // Select mission based on day rotation
  const missionIndex = dayOfYear % availableMissions.length;
  const todayMission = availableMissions[missionIndex];

  // Check if user has progress for today's mission
  const { data: progress } = await supabase
    .from('user_mission_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('mission_id', todayMission.id)
    .eq('date', today)
    .single();

  // Get user's streak info
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    mission: todayMission,
    progress: progress || null,
    streak: streak || null,
  });
}
