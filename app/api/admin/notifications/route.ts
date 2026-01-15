import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  // Check if table exists first
  const { data: notifications, error, count } = await supabase
    .from('user_notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    // Table might not exist yet
    if (error.code === '42P01') {
      return NextResponse.json({
        notifications: [],
        total: 0,
        page: 1,
        totalPages: 0,
        message: 'Notifications table not created yet. Run migration 014.',
      });
    }
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }

  // Get user info for notifications
  const userIds = [...new Set(notifications?.map((n) => n.user_id) || [])];
  let profilesMap = new Map<string, { email: string; name: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, name')
      .in('id', userIds);

    profiles?.forEach((p) => {
      profilesMap.set(p.id, { email: p.email, name: p.name });
    });
  }

  const notificationsWithProfiles = notifications?.map((n) => ({
    ...n,
    profiles: profilesMap.get(n.user_id) || null,
  }));

  return NextResponse.json({
    notifications: notificationsWithProfiles,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  const body = await request.json();
  const { type, title, message, action_url, action_label, icon, target } = body;

  if (!type || !title || !message || !target) {
    return NextResponse.json({ error: 'type, title, message, and target are required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  let userIds: string[] = [];

  // Determine target users
  if (target.type === 'all') {
    const { data: profiles } = await supabase.from('profiles').select('id');
    userIds = profiles?.map((p) => p.id) || [];
  } else if (target.type === 'plan') {
    const { data: entitlements } = await supabase
      .from('user_entitlements')
      .select('user_id')
      .in('plan', target.plans);
    userIds = entitlements?.map((e) => e.user_id) || [];
  } else if (target.type === 'stage') {
    const { data: lifecycle } = await supabase
      .from('user_lifecycle')
      .select('user_id')
      .in('stage', target.stages);
    userIds = lifecycle?.map((l) => l.user_id) || [];
  } else if (target.type === 'users') {
    userIds = target.user_ids || [];
  }

  if (userIds.length === 0) {
    return NextResponse.json({ error: 'No users match the target criteria' }, { status: 400 });
  }

  // Create notifications for all target users
  const notifications = userIds.map((user_id) => ({
    user_id,
    type,
    title,
    message,
    action_url: action_url || null,
    action_label: action_label || null,
    icon: icon || null,
  }));

  const { data, error } = await supabase
    .from('user_notifications')
    .insert(notifications)
    .select();

  if (error) {
    console.error('Failed to create notifications:', error);
    return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 });
  }

  // Log admin action
  await supabase.from('admin_audit_log').insert({
    admin_id: adminCheck.user.id,
    action: 'notifications_sent',
    target_entity_type: 'notification',
    changes: { type, title, target, user_count: userIds.length },
  });

  return NextResponse.json({
    success: true,
    sent_count: userIds.length,
  });
}
