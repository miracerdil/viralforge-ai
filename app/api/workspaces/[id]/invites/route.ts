import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/workspaces/[id]/invites
 * Get pending invites for workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user is admin/owner
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get pending invites
    const { data: invites } = await supabase
      .from('workspace_invites')
      .select(`
        id,
        email,
        role,
        invite_token,
        expires_at,
        resend_count,
        created_at,
        inviter:invited_by(email, full_name)
      `)
      .eq('workspace_id', workspaceId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    return NextResponse.json({
      invites: invites?.map((i: any) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        token: i.invite_token,
        expiresAt: i.expires_at,
        resendCount: i.resend_count,
        createdAt: i.created_at,
        invitedBy: i.inviter?.full_name || i.inviter?.email || 'Unknown',
      })) || [],
    });
  } catch (error: any) {
    console.error('Error fetching invites:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}

/**
 * POST /api/workspaces/[id]/invites
 * Send an invite
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, role = 'viewer' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use database function to create invite
    const { data, error } = await supabase.rpc('invite_workspace_member', {
      p_workspace_id: workspaceId,
      p_inviter_id: user.id,
      p_email: email,
      p_role: role,
    });

    if (error || !data?.success) {
      return NextResponse.json(
        { error: data?.error || 'Failed to create invite' },
        { status: 400 }
      );
    }

    // TODO: Send email with invite link
    // const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.token}`;

    return NextResponse.json({
      success: true,
      inviteId: data.invite_id,
      token: data.token,
      resent: data.resent || false,
    });
  } catch (error: any) {
    console.error('Error creating invite:', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}

/**
 * DELETE /api/workspaces/[id]/invites
 * Cancel an invite
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('inviteId');

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID required' }, { status: 400 });
    }

    // Check permission
    const hasPermission = await supabase.rpc('check_workspace_permission', {
      p_user_id: user.id,
      p_workspace_id: workspaceId,
      p_permission: 'members:invite',
    });

    if (!hasPermission.data) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Delete invite
    const { error } = await supabase
      .from('workspace_invites')
      .delete()
      .eq('id', inviteId)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error deleting invite:', error);
      return NextResponse.json({ error: 'Failed to delete invite' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting invite:', error);
    return NextResponse.json({ error: 'Failed to delete invite' }, { status: 500 });
  }
}
