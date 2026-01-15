import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/services/activity-logger';
import type { RedeemResult } from '@/lib/types/shop';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { item_id } = body;

    if (!item_id || typeof item_id !== 'string') {
      return NextResponse.json({ error: 'Invalid item_id' }, { status: 400 });
    }

    // Use admin client to call RPC (bypasses RLS for function execution)
    const adminClient = createAdminClient();

    const { data, error } = await adminClient.rpc('spend_xp_and_redeem', {
      p_user_id: user.id,
      p_item_id: item_id,
    });

    if (error) {
      console.error('Redeem RPC error:', error);
      return NextResponse.json({ error: 'Redemption failed' }, { status: 500 });
    }

    // RPC returns array, get first row
    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
      return NextResponse.json({ error: 'No result from redemption' }, { status: 500 });
    }

    const redeemResult: RedeemResult = {
      success: result.success,
      new_xp_balance: result.new_xp_balance,
      new_analysis_credits: result.new_analysis_credits,
      new_premium_hooks_until: result.new_premium_hooks_until,
      error_message: result.error_message,
    };

    if (!redeemResult.success) {
      return NextResponse.json(
        { error: redeemResult.error_message || 'Redemption failed' },
        { status: 400 }
      );
    }

    // Log activity for successful redemption
    await logActivity(supabase, user.id, 'reward_redeemed', {
      entityType: 'shop_item',
      entityId: item_id,
      metadata: {
        new_xp_balance: redeemResult.new_xp_balance,
        new_analysis_credits: redeemResult.new_analysis_credits,
        new_premium_hooks_until: redeemResult.new_premium_hooks_until,
      },
    });

    return NextResponse.json(redeemResult);
  } catch (error) {
    console.error('Redeem error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
