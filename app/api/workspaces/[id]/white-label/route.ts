import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/workspaces/[id]/white-label
 * Get white-label settings
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
    // Check if user is owner/admin
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

    // Get white-label settings
    const { data: settings } = await supabase
      .from('white_label_settings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (!settings) {
      return NextResponse.json({ settings: null });
    }

    return NextResponse.json({
      settings: {
        customDomain: settings.custom_domain,
        domainVerified: settings.domain_verified,
        domainVerificationToken: settings.domain_verification_token,
        customLogoUrl: settings.custom_logo_url,
        customFaviconUrl: settings.custom_favicon_url,
        appName: settings.app_name,
        supportEmail: settings.support_email,
        supportUrl: settings.support_url,
        theme: settings.theme_json,
        hideViralForgeBranding: settings.hide_viralforge_branding,
        customCss: settings.custom_css,
        isActive: settings.is_active,
      },
    });
  } catch (error: any) {
    console.error('Error fetching white-label settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PATCH /api/workspaces/[id]/white-label
 * Update white-label settings
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
    // Check permission
    const hasPermission = await supabase.rpc('check_workspace_permission', {
      p_user_id: user.id,
      p_workspace_id: workspaceId,
      p_permission: 'white_label:manage',
    });

    if (!hasPermission.data) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const updates = await request.json();

    // Map camelCase to snake_case
    const dbUpdates: Record<string, any> = {};

    if (updates.customDomain !== undefined) dbUpdates.custom_domain = updates.customDomain;
    if (updates.customLogoUrl !== undefined) dbUpdates.custom_logo_url = updates.customLogoUrl;
    if (updates.customFaviconUrl !== undefined) dbUpdates.custom_favicon_url = updates.customFaviconUrl;
    if (updates.appName !== undefined) dbUpdates.app_name = updates.appName;
    if (updates.supportEmail !== undefined) dbUpdates.support_email = updates.supportEmail;
    if (updates.supportUrl !== undefined) dbUpdates.support_url = updates.supportUrl;
    if (updates.theme !== undefined) dbUpdates.theme_json = updates.theme;
    if (updates.hideViralForgeBranding !== undefined) dbUpdates.hide_viralforge_branding = updates.hideViralForgeBranding;
    if (updates.customCss !== undefined) dbUpdates.custom_css = updates.customCss;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    dbUpdates.updated_at = new Date().toISOString();

    // Check if settings exist
    const { data: existing } = await supabase
      .from('white_label_settings')
      .select('id')
      .eq('workspace_id', workspaceId)
      .single();

    if (existing) {
      // Update
      const { error } = await supabase
        .from('white_label_settings')
        .update(dbUpdates)
        .eq('workspace_id', workspaceId);

      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabase
        .from('white_label_settings')
        .insert({ workspace_id: workspaceId, ...dbUpdates });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating white-label settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
