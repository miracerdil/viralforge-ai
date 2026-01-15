'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { UsersTable } from '@/components/admin/users-table';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { AdminUserView } from '@/lib/types/database';

interface UsersResponse {
  users: AdminUserView[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState(searchParams.get('query') || '');

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (query) params.set('query', query);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
    router.push(`/${locale}/admin/users?query=${encodeURIComponent(newQuery)}&page=1`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    if (query) params.set('query', query);
    router.push(`/${locale}/admin/users?${params}`);
  };

  if (!dictionary) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const t = dictionary.admin;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.userManagement}</h1>
        <p className="text-gray-600 mt-1">
          {locale === 'tr'
            ? 'Kullanıcıları arayın, plan değiştirin ve hesap durumlarını yönetin'
            : 'Search users, change plans, and manage account status'}
        </p>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <UsersTable
          users={users}
          total={total}
          page={page}
          totalPages={totalPages}
          query={query}
          locale={locale}
          dictionary={dictionary}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
