import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CategoriesResponse, CategoryGroup, Category } from '@/lib/types/category';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get optional group filter
  const { searchParams } = new URL(request.url);
  const groupFilter = searchParams.get('group');

  try {
    // Fetch category groups
    const { data: groups, error: groupsError } = await supabase
      .from('category_groups')
      .select('*')
      .order('sort_order');

    if (groupsError) {
      console.error('Failed to fetch category groups:', groupsError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Fetch categories (optionally filtered by group)
    let categoriesQuery = supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (groupFilter && (groupFilter === 'creator' || groupFilter === 'business')) {
      categoriesQuery = categoriesQuery.eq('group_id', groupFilter);
    }

    const { data: categories, error: categoriesError } = await categoriesQuery;

    if (categoriesError) {
      console.error('Failed to fetch categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    const response: CategoriesResponse = {
      groups: (groups || []) as CategoryGroup[],
      categories: (categories || []) as Category[],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
