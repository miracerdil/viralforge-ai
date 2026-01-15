import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'hooks', 'analyses', 'planners', 'ab_tests'
  const format = searchParams.get('format') || 'json'; // 'json' or 'csv'

  if (!type) {
    return NextResponse.json({ error: 'type parameter is required' }, { status: 400 });
  }

  let data: unknown[] = [];
  let filename = '';

  switch (type) {
    case 'hooks': {
      const { data: hooks, error } = await supabase
        .from('generated_hooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch hooks:', error);
        return NextResponse.json({ error: 'Failed to fetch hooks' }, { status: 500 });
      }

      data = hooks || [];
      filename = `viralforge-hooks-${new Date().toISOString().split('T')[0]}`;
      break;
    }

    case 'analyses': {
      const { data: analyses, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch analyses:', error);
        return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
      }

      data = analyses || [];
      filename = `viralforge-analyses-${new Date().toISOString().split('T')[0]}`;
      break;
    }

    case 'planners': {
      const { data: planners, error } = await supabase
        .from('content_planners')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch planners:', error);
        return NextResponse.json({ error: 'Failed to fetch planners' }, { status: 500 });
      }

      data = planners || [];
      filename = `viralforge-planners-${new Date().toISOString().split('T')[0]}`;
      break;
    }

    case 'ab_tests': {
      const { data: tests, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch A/B tests:', error);
        return NextResponse.json({ error: 'Failed to fetch A/B tests' }, { status: 500 });
      }

      data = tests || [];
      filename = `viralforge-abtests-${new Date().toISOString().split('T')[0]}`;
      break;
    }

    default:
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  if (format === 'csv') {
    // Convert to CSV
    if (data.length === 0) {
      return new NextResponse('No data to export', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    const headers = Object.keys(data[0] as object);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = (row as Record<string, unknown>)[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return String(value);
          })
          .join(',')
      ),
    ];

    return new NextResponse(csvRows.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  }

  // Return JSON
  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}.json"`,
    },
  });
}
