'use client';

import { useState, useEffect, useCallback } from 'react';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ActivityItem } from './ActivityItem';
import { ActivityFilters, type ActivityCategory, getActionsForCategory } from './ActivityFilters';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface Activity {
  id: string;
  action: string;
  action_label: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ActivityTimelineProps {
  locale: string;
  dictionary: Dictionary;
}

export function ActivityTimeline({ locale, dictionary }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<ActivityCategory>('all');

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');

      // If filtering by category, we need to filter client-side since API only supports single action filter
      const response = await fetch(`/api/activity?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      let filteredActivities = data.activities || [];

      // Client-side filtering by category
      if (filter !== 'all') {
        const categoryActions = getActionsForCategory(filter);
        filteredActivities = filteredActivities.filter((a: Activity) =>
          categoryActions.includes(a.action)
        );
      }

      setActivities(filteredActivities);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleFilterChange = (newFilter: ActivityCategory) => {
    setFilter(newFilter);
    setPage(1);
  };

  const title = locale === 'tr' ? 'Aktivite Geçmişi' : 'Activity History';
  const emptyText = locale === 'tr' ? 'Henüz aktivite yok' : 'No activity yet';
  const totalText = locale === 'tr' ? 'Toplam' : 'Total';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            {title}
          </CardTitle>
          <ActivityFilters
            activeFilter={filter}
            onFilterChange={handleFilterChange}
            locale={locale}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">{emptyText}</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  locale={locale}
                  dictionary={dictionary}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                {totalText}: {total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
