import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/workspaces/[id]/members
 * Get workspace members
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
    // Check if user is a member
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    // Get all members
    const { data: members } = await supabase
      .from('workspace_members')
      .select(`
        id,
        user_id,
        role,
        is_active,
        joined_at,
        last_active_at,
        user:user_id(email, full_name, avatar_url)
      `)
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('role', { ascending: true });

    return NextResponse.json({
      members: members?.map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        role: m.role,
        isActive: m.is_active,
        joinedAt: m.joined_at,
        lastActiveAt: m.last_active_at,
        email: m.user?.email || '',
        fullName: m.user?.full_name || null,
        avatarUrl: m.user?.avatar_url || null,
      })) || [],
    });
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

/**
 * PATCH /api/workspaces/[id]/members
 * Update member role
 */
export async function PATCH(
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
    const { memberId, role } = await request.json();

    // Check permission
    const hasPermission = await supabase.rpc('check_workspace_permission', {
      p_user_id: user.id,
      p_workspace_id: workspaceId,
      p_permission: 'members:manage',
    });

    if (!hasPermission.data) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get target member's current role
    const { data: targetMember } = await supabase
      .from('workspace_members')
      .select('role, user_id')
      .eq('id', memberId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot change owner's role
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });
    }

    // Update role
    const { error } = await supabase
      .from('workspace_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating member:', error);
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

/**
 * DELETE /api/workspaces/[id]/members
 * Remove a member from workspace
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
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    // Get member to remove
    const { data: targetMember } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('id', memberId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Use database function to remove member
    const { data, error } = await supabase.rpc('remove_workspace_member', {
      p_workspace_id: workspaceId,
      p_remover_id: user.id,
      p_member_id: targetMember.user_id,
    });

    if (error || !data?.success) {
      return NextResponse.json(
        { error: data?.error || 'Failed to remove member' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
