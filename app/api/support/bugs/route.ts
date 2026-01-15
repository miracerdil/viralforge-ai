import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's bug reports
  const { data: bugs, error } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bug reports:', error);
    return NextResponse.json({ error: 'Failed to fetch bug reports' }, { status: 500 });
  }

  return NextResponse.json({ bugs });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, page_url, browser_info, device_info, screenshot_url, severity } = body;

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
  }

  const { data: bug, error } = await supabase
    .from('bug_reports')
    .insert({
      user_id: user.id,
      title,
      description,
      page_url: page_url || null,
      browser_info: browser_info || {},
      device_info: device_info || {},
      screenshot_url: screenshot_url || null,
      severity: severity || 'medium',
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating bug report:', error);
    return NextResponse.json({ error: 'Failed to create bug report' }, { status: 500 });
  }

  return NextResponse.json({ bug, success: true });
}
