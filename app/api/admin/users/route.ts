import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  // Build query
  let dbQuery = supabase
    .from('profiles')
    .select('*, analyses:analyses(count)', { count: 'exact' });

  if (query) {
    dbQuery = dbQuery.or(`email.ilike.%${query}%,name.ilike.%${query}%`);
  }

  const { data: users, error, count } = await dbQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  // Get today's usage for each user
  const today = new Date().toISOString().split('T')[0];
  const userIds = users?.map((u) => u.id) || [];

  const { data: usageData } = await supabase
    .from('usage_daily')
    .select('user_id, analyses_count')
    .in('user_id', userIds)
    .eq('date', today);

  const usageMap = new Map(usageData?.map((u) => [u.user_id, u.analyses_count]) || []);

  const usersWithStats = users?.map((user) => ({
    ...user,
    analyses_count: user.analyses?.[0]?.count || 0,
    usage_today: usageMap.get(user.id) || 0,
  }));

  return NextResponse.json({
    users: usersWithStats,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
