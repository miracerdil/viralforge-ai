import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { FeatureType } from '@/lib/types/entitlements';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feature } = (await request.json()) as { feature: FeatureType };

    if (!feature) {
      return NextResponse.json({ error: 'Feature is required' }, { status: 400 });
    }

    const column = `${feature}_used`;

    // Increment usage counter
    const { error } = await supabase.rpc('increment_column', {
      table_name: 'user_entitlements',
      column_name: column,
      row_id: user.id,
      id_column: 'user_id',
    });

    if (error) {
      // Fallback: direct update
      const { data: current } = await supabase
        .from('user_entitlements')
        .select(column)
        .eq('user_id', user.id)
        .single();

      if (current) {
        const currentValue = (current as Record<string, number>)[column] || 0;
        await supabase
          .from('user_entitlements')
          .update({ [column]: currentValue + 1, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    }

    // Log lifecycle event
    await supabase.from('lifecycle_events').insert({
      user_id: user.id,
      event_type: 'limit_hit',
      feature,
      meta: { action: 'increment' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track usage error:', error);
    return NextResponse.json({ error: 'Failed to track usage' }, { status: 500 });
  }
}
