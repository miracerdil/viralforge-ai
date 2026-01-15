import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  const supabase = createAdminClient();

  // Get lifecycle stage counts
  const { data: stageData, error: stageError } = await supabase
    .from('user_lifecycle')
    .select('stage, last_activity_at');

  if (stageError) {
    console.error('Failed to fetch lifecycle data:', stageError);
    return NextResponse.json({ error: 'Failed to fetch lifecycle data' }, { status: 500 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Aggregate by stage
  const stageMap = new Map<string, { count: number; active7: number; active30: number }>();
  const stages = ['new_user', 'activated', 'engaged', 'at_risk', 'churn_risk'];

  stages.forEach((stage) => {
    stageMap.set(stage, { count: 0, active7: 0, active30: 0 });
  });

  stageData?.forEach((row) => {
    const existing = stageMap.get(row.stage) || { count: 0, active7: 0, active30: 0 };
    existing.count++;

    const lastActivity = new Date(row.last_activity_at);
    if (lastActivity >= sevenDaysAgo) existing.active7++;
    if (lastActivity >= thirtyDaysAgo) existing.active30++;

    stageMap.set(row.stage, existing);
  });

  const stagesResult = stages.map((stage) => {
    const data = stageMap.get(stage) || { count: 0, active7: 0, active30: 0 };
    return {
      stage,
      user_count: data.count,
      active_last_7_days: data.active7,
      active_last_30_days: data.active30,
    };
  });

  const totalUsers = stagesResult.reduce((sum, s) => sum + s.user_count, 0);

  // Calculate conversion rates
  const newUsers = stageMap.get('new_user')?.count || 0;
  const activated = stageMap.get('activated')?.count || 0;
  const engaged = stageMap.get('engaged')?.count || 0;
  const atRisk = stageMap.get('at_risk')?.count || 0;

  const conversion_rates = {
    new_to_activated: newUsers > 0 ? ((activated + engaged + atRisk) / (newUsers + activated + engaged + atRisk)) * 100 : 0,
    activated_to_engaged: activated > 0 ? ((engaged) / (activated + engaged)) * 100 : 0,
    engaged_to_at_risk: engaged > 0 ? ((atRisk) / (engaged + atRisk)) * 100 : 0,
  };

  return NextResponse.json({
    stages: stagesResult,
    total_users: totalUsers,
    conversion_rates,
  });
}
