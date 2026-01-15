'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Users, Crown, UserCheck, Ban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

interface Stats {
  total: number;
  pro: number;
  free: number;
  disabled: number;
}

export default function AdminDashboardPage() {
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
  const [stats, setStats] = useState<Stats>({ total: 0, pro: 0, free: 0, disabled: 0 });

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

      // Calculate stats from first page data (approximate)
      if (page === 1 && !query) {
        const proCount = data.users.filter((u) => u.plan === 'PRO').length;
        const disabledCount = data.users.filter((u) => u.is_disabled).length;
        setStats({
          total: data.total,
          pro: proCount,
          free: data.total - proCount,
          disabled: disabledCount,
        });
      }
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
    router.push(`/${locale}/admin?query=${encodeURIComponent(newQuery)}&page=1`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    if (query) params.set('query', query);
    router.push(`/${locale}/admin?${params}`);
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
      <h1 className="text-2xl font-bold text-gray-900">{t.dashboard}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.totalUsers}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.proUsers}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pro}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.freeUsers}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.free}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.disabledUsers}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.disabled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
