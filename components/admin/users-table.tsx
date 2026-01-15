'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils/date';
import type { AdminUserView } from '@/lib/types/database';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface UsersTableProps {
  users: AdminUserView[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
  locale: string;
  dictionary: Dictionary;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
}

export function UsersTable({
  users,
  total,
  page,
  totalPages,
  query,
  locale,
  dictionary,
  onSearch,
  onPageChange,
}: UsersTableProps) {
  const [searchValue, setSearchValue] = useState(query);
  const t = dictionary.admin;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const getStatusBadge = (user: AdminUserView) => {
    if (user.is_disabled) {
      return <Badge variant="error">{t.status.disabled}</Badge>;
    }
    if (user.comped_until && user.comped_until >= new Date().toISOString().split('T')[0]) {
      return <Badge variant="info">{t.status.comped}</Badge>;
    }
    return <Badge variant="success">{t.status.active}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>{t.userManagement}</CardTitle>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-64"
            />
            <Button type="submit" variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t.noUsers}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      {t.table.email}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      {t.table.name}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      {t.table.plan}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      {t.table.status}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      {t.table.analyses}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      {t.table.createdAt}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                      {t.table.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{user.name || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={user.plan === 'PRO' ? 'success' : 'default'}>
                          {user.plan}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(user)}</td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{user.analyses_count || 0}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500">
                          {formatDate(new Date(user.created_at), locale)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/${locale}/admin/users/${user.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            {dictionary.common.edit}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                {t.totalUsers}: {total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
