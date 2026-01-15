import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/referrals
 * Get user's referral stats and history
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
    // Get user's referral code
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, referral_count, referred_by')
      .eq('id', user.id)
      .single();

    // Get referrals made by this user
    const { data: referrals } = await supabase
      .from('referrals')
      .select(`
        id,
        referral_code,
        status,
        signed_up_at,
        converted_at,
        created_at,
        referred_user:referred_user_id(email)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    // Get rewards earned
    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Calculate stats
    const stats = {
      totalReferrals: referrals?.length || 0,
      signedUp: referrals?.filter((r) => r.status === 'signed_up' || r.status === 'converted').length || 0,
      converted: referrals?.filter((r) => r.status === 'converted').length || 0,
      totalXpEarned: rewards?.filter((r) => r.reward_type === 'xp').reduce((sum, r) => sum + r.reward_value, 0) || 0,
      totalCreditsEarned: rewards?.filter((r) => r.reward_type === 'usage_credit').reduce((sum, r) => sum + r.reward_value, 0) || 0,
    };

    return NextResponse.json({
      referralCode: profile?.referral_code,
      referralCount: profile?.referral_count || 0,
      wasReferred: !!profile?.referred_by,
      referrals: referrals || [],
      rewards: rewards || [],
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json({ error: 'Failed to fetch referral data' }, { status: 500 });
  }
}

/**
 * POST /api/referrals
 * Process a referral signup
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
    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    // Call the database function to process referral
    const { data, error } = await supabase.rpc('process_referral_signup', {
      p_new_user_id: user.id,
      p_referral_code: referralCode.toUpperCase(),
    });

    if (error) {
      console.error('Error processing referral:', error);
      return NextResponse.json({ error: 'Failed to process referral' }, { status: 500 });
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      referralId: data.referral_id,
      xpEarned: data.referred_xp,
      message: `You earned ${data.referred_xp} XP from this referral!`,
    });
  } catch (error: any) {
    console.error('Error processing referral:', error);
    return NextResponse.json({ error: 'Failed to process referral' }, { status: 500 });
  }
}
