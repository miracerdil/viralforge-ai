import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  const { id } = await params;
  const supabase = createAdminClient();

  // Get user profile
  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get total analyses count
  const { count: analysesCount } = await supabase
    .from('analyses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id);

  // Get today's usage
  const today = new Date().toISOString().split('T')[0];
  const { data: usageData } = await supabase
    .from('usage_daily')
    .select('analyses_count')
    .eq('user_id', id)
    .eq('date', today)
    .single();

  return NextResponse.json({
    user: {
      ...user,
      analyses_count: analysesCount || 0,
      usage_today: usageData?.analyses_count || 0,
    },
  });
}
