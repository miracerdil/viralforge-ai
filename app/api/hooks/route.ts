import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasProAccess } from '@/lib/admin';
import { FREE_HOOKS_LIMIT } from '@/lib/types/hooks';
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
    const platform = searchParams.get('platform');
    const niche = searchParams.get('niche');
    const tone = searchParams.get('tone');
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get user profile to check plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, comped_until')
      .eq('id', user.id)
      .single();

    const isPro = profile ? hasProAccess(profile.plan, profile.comped_until) : false;

    // Build query
    let query = supabase
      .from('hook_templates')
      .select('*', { count: 'exact' })
      .eq('locale', locale);

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (niche) {
      query = query.eq('niche', niche);
    }

    if (tone) {
      query = query.eq('tone', tone);
    }

    if (q) {
      query = query.ilike('hook_text', `%${q}%`);
    }

    // Apply limit for FREE users
    const effectiveLimit = isPro ? limit : Math.min(limit, FREE_HOOKS_LIMIT);
    const effectiveOffset = isPro ? offset : Math.min(offset, FREE_HOOKS_LIMIT - effectiveLimit);

    query = query.order('created_at', { ascending: false }).range(effectiveOffset, effectiveOffset + effectiveLimit - 1);

    const { data: hooks, error, count } = await query;

    if (error) {
      console.error('Failed to fetch hooks:', error);
      return NextResponse.json({ error: 'Failed to fetch hooks' }, { status: 500 });
    }

    // Get user favorites
    const { data: favorites } = await supabase
      .from('user_favorite_hooks')
      .select('hook_id')
      .eq('user_id', user.id);

    const favoriteIds = new Set(favorites?.map((f) => f.hook_id) || []);

    // Add favorite status to hooks
    const hooksWithFavorites: HookWithFavorite[] = (hooks || []).map((hook) => ({
      ...hook,
      is_favorite: favoriteIds.has(hook.id),
    }));

    return NextResponse.json({
      hooks: hooksWithFavorites,
      total: count || 0,
      has_more: isPro ? (count || 0) > effectiveOffset + effectiveLimit : false,
      is_limited: !isPro,
    });
  } catch (error) {
    console.error('Hooks fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch hooks' }, { status: 500 });
  }
}
