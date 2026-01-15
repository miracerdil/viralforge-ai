import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ShopItem } from '@/lib/types/shop';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: items, error } = await supabase
      .from('shop_items')
      .select('*')
      .eq('is_active', true)
      .order('xp_cost', { ascending: true });

    if (error) {
      console.error('Failed to fetch shop items:', error);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    return NextResponse.json({ items: items as ShopItem[] });
  } catch (error) {
    console.error('Shop items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
