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
  const { date } = body as { date?: string };

  // Default to today if no date provided
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Delete the usage record for the specified date
  const { error } = await supabase
    .from('usage_daily')
    .delete()
    .eq('user_id', id)
    .eq('date', targetDate);

  if (error) {
    console.error('Failed to reset quota:', error);
    return NextResponse.json({ error: 'Failed to reset quota' }, { status: 500 });
  }

  return NextResponse.json({ success: true, date: targetDate });
}
