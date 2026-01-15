import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/affiliate
 * Get user's affiliate status and dashboard data
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user is an affiliate
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!affiliate) {
      return NextResponse.json({ isAffiliate: false });
    }

    // Get recent conversions
    const { data: conversions } = await supabase
      .from('affiliate_conversions')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get recent clicks (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: clicks } = await supabase
      .from('affiliate_clicks')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Get payouts
    const { data: payouts } = await supabase
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    // Calculate click stats by day
    const clicksByDay = clicks?.reduce((acc, click) => {
      const date = new Date(click.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      isAffiliate: true,
      affiliate: {
        id: affiliate.id,
        affiliateCode: affiliate.affiliate_code,
        status: affiliate.status,
        commissionRate: affiliate.commission_rate,
        totalClicks: affiliate.total_clicks,
        totalConversions: affiliate.total_conversions,
        totalEarnings: affiliate.total_earnings,
        totalPaid: affiliate.total_paid,
        pendingBalance: affiliate.pending_balance,
        payoutMethod: affiliate.payout_method,
        minPayoutAmount: affiliate.min_payout_amount,
        createdAt: affiliate.created_at,
      },
      conversions: conversions || [],
      recentClicks: clicks?.slice(0, 10) || [],
      clicksByDay,
      payouts: payouts || [],
    });
  } catch (error: any) {
    console.error('Error fetching affiliate data:', error);
    return NextResponse.json({ error: 'Failed to fetch affiliate data' }, { status: 500 });
  }
}

/**
 * POST /api/affiliate
 * Apply to become an affiliate
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { applicationNote, payoutMethod, payoutDetails } = await request.json();

    // Check if already an affiliate
    const { data: existing } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'Application already pending' }, { status: 400 });
      }
      if (existing.status === 'approved') {
        return NextResponse.json({ error: 'Already an approved affiliate' }, { status: 400 });
      }
    }

    // Generate affiliate code
    const { data: code } = await supabase.rpc('generate_affiliate_code', {
      p_user_id: user.id,
    });

    // Create affiliate application
    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .insert({
        user_id: user.id,
        affiliate_code: code || `AFF${Date.now()}`,
        status: 'pending',
        application_note: applicationNote,
        payout_method: payoutMethod,
        payout_details: payoutDetails || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating affiliate application:', error);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      affiliateId: affiliate.id,
      affiliateCode: affiliate.affiliate_code,
      status: affiliate.status,
      message: 'Application submitted successfully',
    });
  } catch (error: any) {
    console.error('Error processing affiliate application:', error);
    return NextResponse.json({ error: 'Failed to process application' }, { status: 500 });
  }
}

/**
 * PATCH /api/affiliate
 * Update affiliate settings (payout method, etc.)
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updates = await request.json();

    // Only allow updating certain fields
    const allowedFields = ['payout_method', 'payout_details'];
    const filteredUpdates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    filteredUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('affiliates')
      .update(filteredUpdates)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating affiliate:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating affiliate:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
