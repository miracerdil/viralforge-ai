import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  const supabase = createAdminClient();

  const { data: flags, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('flag_name', { ascending: true });

  if (error) {
    console.error('Failed to fetch feature flags:', error);
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }

  return NextResponse.json({ flags });
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  const body = await request.json();
  const { flag_key, flag_name, description, is_enabled, target_plans, target_user_ids } = body;

  if (!flag_key || !flag_name) {
    return NextResponse.json({ error: 'flag_key and flag_name are required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .insert({
      flag_key,
      flag_name,
      description: description || null,
      is_enabled: is_enabled || false,
      target_plans: target_plans || [],
      target_user_ids: target_user_ids || [],
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create feature flag:', error);
    return NextResponse.json({ error: 'Failed to create feature flag' }, { status: 500 });
  }

  // Log admin action
  await supabase.from('admin_audit_log').insert({
    admin_id: adminCheck.user.id,
    action: 'feature_flag_created',
    target_entity_type: 'feature_flag',
    target_entity_id: data.id,
    changes: { flag_key, flag_name },
  });

  return NextResponse.json({ flag: data });
}

export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get current flag state for audit log
  const { data: currentFlag } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('feature_flags')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update feature flag:', error);
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }

  // Log admin action
  await supabase.from('admin_audit_log').insert({
    admin_id: adminCheck.user.id,
    action: 'feature_flag_updated',
    target_entity_type: 'feature_flag',
    target_entity_id: id,
    changes: { before: currentFlag, after: data },
  });

  return NextResponse.json({ flag: data });
}

export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get flag info for audit log
  const { data: flag } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('feature_flags')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete feature flag:', error);
    return NextResponse.json({ error: 'Failed to delete feature flag' }, { status: 500 });
  }

  // Log admin action
  await supabase.from('admin_audit_log').insert({
    admin_id: adminCheck.user.id,
    action: 'feature_flag_deleted',
    target_entity_type: 'feature_flag',
    changes: { deleted_flag: flag },
  });

  return NextResponse.json({ success: true });
}
