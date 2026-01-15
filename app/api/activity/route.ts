import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const action = searchParams.get('action');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('user_activity_log')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (action) {
    query = query.eq('action', action);
  }

  const { data: activities, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to fetch activity log:', error);
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 });
  }

  return NextResponse.json({
    activities,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
