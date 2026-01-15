import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/workspaces
 * Get user's workspaces
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: memberData } = await supabase
      .from('workspace_members')
      .select(`
        role,
        workspace:workspace_id(
          id,
          name,
          slug,
          logo_url,
          plan_type,
          max_members,
          hooks_limit,
          is_active,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    const workspaces = memberData?.map((m: any) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      logoUrl: m.workspace.logo_url,
      planType: m.workspace.plan_type,
      maxMembers: m.workspace.max_members,
      hooksLimit: m.workspace.hooks_limit,
      isActive: m.workspace.is_active,
      role: m.role,
      createdAt: m.workspace.created_at,
    })) || [];

    return NextResponse.json({ workspaces });
  } catch (error: any) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}

/**
 * POST /api/workspaces
 * Create a new workspace
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, slug, planType = 'team' } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug is available
    const { data: existingSlug } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingSlug) {
      return NextResponse.json({ error: 'Slug is already taken' }, { status: 400 });
    }

    // Create workspace using database function
    const { data: workspaceId, error } = await supabase.rpc('create_workspace', {
      p_owner_id: user.id,
      p_name: name,
      p_slug: slug,
      p_plan_type: planType,
    });

    if (error) {
      console.error('Error creating workspace:', error);
      return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      workspaceId,
    });
  } catch (error: any) {
    console.error('Error creating workspace:', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
