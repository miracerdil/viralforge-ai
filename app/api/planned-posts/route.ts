import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createPlannedPost,
  updatePlannedPost,
  deletePlannedPost,
  getUserPosts,
  getUpcomingPosts,
} from '@/lib/services/publishing';
import { toPlannedPostDisplay, type PlannedPostStatus } from '@/lib/types/publishing';
import type { Platform } from '@/lib/types/platform';

/**
 * GET /api/planned-posts
 * Fetch planned posts for the authenticated user
 */
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
    const locale = (searchParams.get('locale') || 'tr') as 'tr' | 'en';
    const status = searchParams.get('status') as PlannedPostStatus | null;
    const platform = searchParams.get('platform') as Platform | null;
    const upcoming = searchParams.get('upcoming') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (upcoming) {
      // Get only upcoming planned posts
      const posts = await getUpcomingPosts(supabase, user.id, limit);
      const displayPosts = posts.map((p) => toPlannedPostDisplay(p, locale));

      return NextResponse.json({
        success: true,
        posts: displayPosts,
        total: posts.length,
        hasMore: false,
      });
    }

    // Get all posts with filters
    const { posts, total } = await getUserPosts(supabase, user.id, {
      status: status || undefined,
      platform: platform || undefined,
      limit,
      offset,
    });

    const displayPosts = posts.map((p) => toPlannedPostDisplay(p, locale));

    return NextResponse.json({
      success: true,
      posts: displayPosts,
      total,
      hasMore: offset + posts.length < total,
    });
  } catch (error) {
    console.error('Error fetching planned posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/planned-posts
 * Create a new planned post
 */
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
    const {
      platform,
      hook,
      caption,
      hashtags,
      scheduled_at,
      source_suggestion_id,
      source_generation_id,
      notes,
      locale = 'tr',
    } = body;

    // Validate required fields
    if (!platform || !hook || !scheduled_at) {
      return NextResponse.json(
        { error: 'platform, hook, and scheduled_at are required' },
        { status: 400 }
      );
    }

    // Create the post
    const post = await createPlannedPost(supabase, user.id, {
      platform,
      hook,
      caption,
      hashtags,
      scheduled_at,
      source_suggestion_id,
      source_generation_id,
      notes,
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    const displayPost = toPlannedPostDisplay(post, locale as 'tr' | 'en');

    return NextResponse.json({
      success: true,
      post: displayPost,
    });
  } catch (error) {
    console.error('Error creating planned post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/planned-posts
 * Update an existing planned post
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, hook, caption, hashtags, scheduled_at, status, notes, locale = 'tr' } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Update the post
    const post = await updatePlannedPost(supabase, user.id, {
      id,
      hook,
      caption,
      hashtags,
      scheduled_at,
      status,
      notes,
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      );
    }

    const displayPost = toPlannedPostDisplay(post, locale as 'tr' | 'en');

    return NextResponse.json({
      success: true,
      post: displayPost,
    });
  } catch (error) {
    console.error('Error updating planned post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/planned-posts
 * Delete a planned post
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const success = await deletePlannedPost(supabase, user.id, id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted',
    });
  } catch (error) {
    console.error('Error deleting planned post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
