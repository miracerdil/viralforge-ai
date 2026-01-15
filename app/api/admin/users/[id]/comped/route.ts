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
  const { comped_until } = body as { comped_until: string | null };

  // Validate date format if provided
  if (comped_until && !/^\d{4}-\d{2}-\d{2}$/.test(comped_until)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('profiles')
    .update({ comped_until })
    .eq('id', id);

  if (error) {
    console.error('Failed to update comped_until:', error);
    return NextResponse.json({ error: 'Failed to update comped date' }, { status: 500 });
  }

  return NextResponse.json({ success: true, comped_until });
}
