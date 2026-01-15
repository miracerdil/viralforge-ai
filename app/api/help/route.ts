import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const query = searchParams.get('q');
  const locale = searchParams.get('locale') || 'en';

  try {
    // Get categories
    const { data: categories, error: categoriesError } = await supabase
      .from('help_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (categoriesError) {
      console.error('Error fetching help categories:', categoriesError);
    }

    // Build articles query
    let articlesQuery = supabase
      .from('help_articles')
      .select('*')
      .eq('is_published', true)
      .order('sort_order');

    if (category) {
      articlesQuery = articlesQuery.eq('category', category);
    }

    if (query) {
      const searchField = locale === 'tr' ? 'title_tr' : 'title_en';
      const contentField = locale === 'tr' ? 'content_md_tr' : 'content_md_en';
      articlesQuery = articlesQuery.or(`${searchField}.ilike.%${query}%,${contentField}.ilike.%${query}%`);
    }

    const { data: articles, error: articlesError } = await articlesQuery;

    if (articlesError) {
      console.error('Error fetching help articles:', articlesError);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    return NextResponse.json({
      categories: categories || [],
      articles: articles || [],
    });
  } catch (error) {
    console.error('Help API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const body = await request.json();
  const { articleId, action } = body;

  if (action === 'helpful') {
    // Increment helpful count
    const { error } = await supabase.rpc('increment_helpful_count', {
      p_article_id: articleId,
    });

    if (error) {
      // If RPC doesn't exist, try direct update
      await supabase
        .from('help_articles')
        .update({ helpful_count: supabase.rpc('coalesce', { helpful_count: 0 }) })
        .eq('id', articleId);
    }

    return NextResponse.json({ success: true });
  }

  if (action === 'view') {
    // Increment view count
    await supabase
      .from('help_articles')
      .update({ view_count: supabase.rpc('coalesce', { view_count: 0 }) })
      .eq('id', articleId);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
