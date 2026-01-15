import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasProAccess } from '@/lib/admin';
import { FREE_FAVORITES_LIMIT } from '@/lib/types/hooks';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hook_id } = await request.json();

    if (!hook_id) {
      return NextResponse.json({ error: 'hook_id is required' }, { status: 400 });
    }

    // Get user profile to check plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, comped_until')
      .eq('id', user.id)
      .single();

    const isPro = profile ? hasProAccess(profile.plan, profile.comped_until) : false;

    // Check favorite limit for FREE users
    if (!isPro) {
      const { count } = await supabase
        .from('user_favorite_hooks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((count || 0) >= FREE_FAVORITES_LIMIT) {
        return NextResponse.json(
          {
            error: 'favorites_limit_reached',
            message: 'Favorite limit reached. Upgrade to Pro for unlimited favorites.',
          },
          { status: 403 }
        );
      }
    }

    // Add to favorites
    const { error } = await supabase.from('user_favorite_hooks').insert({
      user_id: user.id,
      hook_id,
    });

    if (error) {
      if (error.code === '23505') {
        // Already favorited
        return NextResponse.json({ success: true, already_favorited: true });
      }
      console.error('Failed to add favorite:', error);
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hook_id } = await request.json();

    if (!hook_id) {
      return NextResponse.json({ error: 'hook_id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_favorite_hooks')
      .delete()
      .eq('user_id', user.id)
      .eq('hook_id', hook_id);

    if (error) {
      console.error('Failed to remove favorite:', error);
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
