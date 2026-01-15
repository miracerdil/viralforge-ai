import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ShopHistoryResponse, Redemption, XpLedgerEntry } from '@/lib/types/shop';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch recent redemptions
    const { data: redemptions, error: redemptionsError } = await supabase
      .from('redemptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (redemptionsError) {
      console.error('Failed to fetch redemptions:', redemptionsError);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // Fetch recent ledger entries
    const { data: ledger, error: ledgerError } = await supabase
      .from('xp_ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (ledgerError) {
      console.error('Failed to fetch ledger:', ledgerError);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    // Calculate totals
    const totalEarned = (ledger || [])
      .filter((entry: XpLedgerEntry) => entry.type === 'earn')
      .reduce((sum: number, entry: XpLedgerEntry) => sum + entry.amount, 0);

    const totalSpent = (ledger || [])
      .filter((entry: XpLedgerEntry) => entry.type === 'spend')
      .reduce((sum: number, entry: XpLedgerEntry) => sum + entry.amount, 0);

    const response: ShopHistoryResponse = {
      redemptions: (redemptions || []) as Redemption[],
      ledger: (ledger || []) as XpLedgerEntry[],
      total_earned: totalEarned,
      total_spent: totalSpent,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Shop history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
