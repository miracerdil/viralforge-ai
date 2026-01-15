import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);

  const supabase = createAdminClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get AI usage logs
  const { data: logs, error } = await supabase
    .from('ai_usage_logs')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch AI usage logs:', error);
    return NextResponse.json({ error: 'Failed to fetch AI usage logs' }, { status: 500 });
  }

  // Aggregate by day
  const dailyData = new Map<string, { cost: number; requests: number; tokens: number }>();
  const featureData = new Map<string, { cost: number; requests: number; tokens: number }>();
  const modelData = new Map<string, { cost: number; requests: number; tokens: number }>();

  let totalCost = 0;
  let totalRequests = 0;
  let totalTokens = 0;

  logs?.forEach((log) => {
    const date = log.created_at.split('T')[0];
    const tokens = (log.input_tokens || 0) + (log.output_tokens || 0);
    const cost = parseFloat(log.cost_usd) || 0;

    // Daily aggregation
    const existing = dailyData.get(date) || { cost: 0, requests: 0, tokens: 0 };
    dailyData.set(date, {
      cost: existing.cost + cost,
      requests: existing.requests + 1,
      tokens: existing.tokens + tokens,
    });

    // Feature aggregation
    const featureExisting = featureData.get(log.feature) || { cost: 0, requests: 0, tokens: 0 };
    featureData.set(log.feature, {
      cost: featureExisting.cost + cost,
      requests: featureExisting.requests + 1,
      tokens: featureExisting.tokens + tokens,
    });

    // Model aggregation
    const modelExisting = modelData.get(log.model) || { cost: 0, requests: 0, tokens: 0 };
    modelData.set(log.model, {
      cost: modelExisting.cost + cost,
      requests: modelExisting.requests + 1,
      tokens: modelExisting.tokens + tokens,
    });

    totalCost += cost;
    totalRequests += 1;
    totalTokens += tokens;
  });

  // Convert to arrays
  const dailyArray = Array.from(dailyData.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const featureArray = Array.from(featureData.entries())
    .map(([feature, data]) => ({ feature, ...data }))
    .sort((a, b) => b.cost - a.cost);

  const modelArray = Array.from(modelData.entries())
    .map(([model, data]) => ({ model, ...data }))
    .sort((a, b) => b.cost - a.cost);

  // Get top users by cost
  const userCosts = new Map<string, { cost: number; requests: number }>();
  logs?.forEach((log) => {
    if (log.user_id) {
      const existing = userCosts.get(log.user_id) || { cost: 0, requests: 0 };
      userCosts.set(log.user_id, {
        cost: existing.cost + (parseFloat(log.cost_usd) || 0),
        requests: existing.requests + 1,
      });
    }
  });

  const topUserIds = Array.from(userCosts.entries())
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 10)
    .map(([id]) => id);

  // Get user details for top users
  let topUsers: Array<{ id: string; email: string; name: string | null; cost: number; requests: number }> = [];
  if (topUserIds.length > 0) {
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, email, name')
      .in('id', topUserIds);

    topUsers = topUserIds.map((id) => {
      const profile = userProfiles?.find((p) => p.id === id);
      const userData = userCosts.get(id) || { cost: 0, requests: 0 };
      return {
        id,
        email: profile?.email || 'Unknown',
        name: profile?.name || null,
        cost: userData.cost,
        requests: userData.requests,
      };
    });
  }

  return NextResponse.json({
    summary: {
      total_cost: totalCost,
      total_requests: totalRequests,
      total_tokens: totalTokens,
      avg_cost_per_request: totalRequests > 0 ? totalCost / totalRequests : 0,
      period_days: days,
    },
    daily: dailyArray,
    by_feature: featureArray,
    by_model: modelArray,
    top_users: topUsers,
  });
}
