import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's shares
  const { data: shares, error } = await supabase
    .from('content_shares')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch shares:', error);
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 });
  }

  return NextResponse.json({ shares });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { content_type, content_id, title, expires_in_days } = body;

  if (!content_type || !content_id) {
    return NextResponse.json({ error: 'content_type and content_id are required' }, { status: 400 });
  }

  // Verify user owns the content
  const validTypes: Record<string, string> = {
    hooks: 'generated_hooks',
    analysis: 'analyses',
    planner: 'content_planners',
    ab_test: 'ab_tests',
  };

  const tableName = validTypes[content_type];
  if (!tableName) {
    return NextResponse.json({ error: 'Invalid content_type' }, { status: 400 });
  }

  const { data: content, error: contentError } = await supabase
    .from(tableName)
    .select('id')
    .eq('id', content_id)
    .eq('user_id', user.id)
    .single();

  if (contentError || !content) {
    return NextResponse.json({ error: 'Content not found or access denied' }, { status: 404 });
  }

  // Generate share token
  const shareToken = crypto.randomBytes(16).toString('hex');

  // Calculate expiration
  let expiresAt = null;
  if (expires_in_days) {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + expires_in_days);
    expiresAt = expDate.toISOString();
  }

  // Create share
  const { data: share, error: shareError } = await supabase
    .from('content_shares')
    .insert({
      user_id: user.id,
      share_token: shareToken,
      content_type,
      content_id,
      title: title || null,
      is_public: true,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (shareError) {
    console.error('Failed to create share:', shareError);
    return NextResponse.json({ error: 'Failed to create share' }, { status: 500 });
  }

  // Log activity
  await supabase.from('user_activity_log').insert({
    user_id: user.id,
    action: 'share_created',
    action_label: 'Share Link Created',
    entity_type: content_type,
    entity_id: content_id,
    metadata: { share_token: shareToken },
  });

  return NextResponse.json({
    share,
    share_url: `/share/${shareToken}`,
  });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get('id');

  if (!shareId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('content_shares')
    .delete()
    .eq('id', shareId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to delete share:', error);
    return NextResponse.json({ error: 'Failed to delete share' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
