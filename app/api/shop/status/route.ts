import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ShopStatus } from '@/lib/types/shop';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('xp_balance, premium_hooks_until, analysis_credit_balance')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error('Failed to fetch profile:', error);
      return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }

    const now = new Date();
    const premiumUntil = profile.premium_hooks_until ? new Date(profile.premium_hooks_until) : null;
    const hasPremiumHooks = premiumUntil ? premiumUntil > now : false;
    const remainingSeconds = hasPremiumHooks && premiumUntil
      ? Math.floor((premiumUntil.getTime() - now.getTime()) / 1000)
      : null;

    const status: ShopStatus = {
      xp_balance: profile.xp_balance || 0,
      premium_hooks_until: profile.premium_hooks_until,
      analysis_credit_balance: profile.analysis_credit_balance || 0,
      has_premium_hooks: hasPremiumHooks,
      premium_hooks_remaining_seconds: remainingSeconds,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Shop status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
