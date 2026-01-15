import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  const { id } = await params;
  const body = await request.json();
  const { is_disabled } = body as { is_disabled: boolean };

  if (typeof is_disabled !== 'boolean') {
    return NextResponse.json({ error: 'is_disabled must be a boolean' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('profiles')
    .update({ is_disabled })
    .eq('id', id);

  if (error) {
    console.error('Failed to update is_disabled:', error);
    return NextResponse.json({ error: 'Failed to update account status' }, { status: 500 });
  }

  return NextResponse.json({ success: true, is_disabled });
}
