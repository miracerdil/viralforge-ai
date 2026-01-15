import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { HookWithFavorite } from '@/lib/types/hooks';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || 'tr';

    // Get user favorites with hook details
    const { data: favorites, error, count } = await supabase
      .from('user_favorite_hooks')
      .select(
        `
        hook_id,
        created_at,
        hook_templates (*)
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch favorites:', error);
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }

    // Transform to HookWithFavorite format
    const hooks: HookWithFavorite[] = (favorites || [])
      .filter((f) => f.hook_templates)
      .map((f) => ({
        ...(f.hook_templates as unknown as HookWithFavorite),
        is_favorite: true,
      }))
      .filter((h) => !locale || h.locale === locale);

    return NextResponse.json({
      favorites: hooks,
      total: hooks.length,
    });
  } catch (error) {
    console.error('Favorites fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}
