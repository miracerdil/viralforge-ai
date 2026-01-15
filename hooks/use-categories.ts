'use client';

import { useState, useEffect } from 'react';
import type { Category, CategoryGroup, CategoriesResponse } from '@/lib/types/category';

interface UseCategoriesResult {
  categories: Category[];
  groups: CategoryGroup[];
  loading: boolean;
  error: string | null;
  getCategoriesByGroup: (groupId: string) => Category[];
}

// Simple in-memory cache
let cachedData: CategoriesResponse | null = null;

export function useCategories(): UseCategoriesResult {
  const [data, setData] = useState<CategoriesResponse | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const result: CategoriesResponse = await response.json();
        cachedData = result;
        setData(result);
      } catch (err) {
        console.error('Categories fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const getCategoriesByGroup = (groupId: string): Category[] => {
    if (!data) return [];
    return data.categories.filter((cat) => cat.group_id === groupId);
  };

  return {
    categories: data?.categories || [],
    groups: data?.groups || [],
    loading,
    error,
    getCategoriesByGroup,
  };
}

// Clear cache (useful for testing or forced refresh)
export function clearCategoriesCache() {
  cachedData = null;
}
