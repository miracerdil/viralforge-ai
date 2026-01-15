import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get onboarding status using the database function
  const { data: steps, error } = await supabase.rpc('get_onboarding_status', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('Error fetching onboarding status:', error);
    // Fallback: get config directly
    const { data: config } = await supabase
      .from('onboarding_config')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    const { data: progress } = await supabase
      .from('onboarding_progress')
      .select('step_key, completed_at')
      .eq('user_id', user.id);

    const progressMap = new Map(progress?.map((p) => [p.step_key, p.completed_at]));

    const fallbackSteps = config?.map((step) => ({
      ...step,
      is_completed: progressMap.has(step.step_key),
      completed_at: progressMap.get(step.step_key) || null,
    }));

    return NextResponse.json({ steps: fallbackSteps || [] });
  }

  // Calculate progress
  const totalSteps = steps?.length || 0;
  const completedSteps = steps?.filter((s: any) => s.is_completed).length || 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return NextResponse.json({
    steps: steps || [],
    progress,
    totalSteps,
    completedSteps,
    isComplete: completedSteps === totalSteps && totalSteps > 0,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { stepKey } = body;

  if (!stepKey) {
    return NextResponse.json({ error: 'stepKey is required' }, { status: 400 });
  }

  // Complete the step using the database function
  const { data: result, error } = await supabase.rpc('complete_onboarding_step', {
    p_user_id: user.id,
    p_step_key: stepKey,
  });

  if (error) {
    console.error('Error completing onboarding step:', error);
    return NextResponse.json({ error: 'Failed to complete step' }, { status: 500 });
  }

  return NextResponse.json(result);
}
