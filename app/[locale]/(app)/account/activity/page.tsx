'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  History,
  Sparkles,
  Video,
  Calendar,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
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

const actionConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  hook_generated: { icon: Sparkles, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  video_analyzed: { icon: Video, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  planner_created: { icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-100' },
  ab_test_created: { icon: GitCompare, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  plan_upgraded: { icon: Sparkles, color: 'text-primary-600', bgColor: 'bg-primary-100' },
  default: { icon: History, color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const actionLabels: Record<string, { tr: string; en: string }> = {
  hook_generated: { tr: 'Hook Oluşturuldu', en: 'Hook Generated' },
  video_analyzed: { tr: 'Video Analiz Edildi', en: 'Video Analyzed' },
  planner_created: { tr: 'Plan Oluşturuldu', en: 'Plan Created' },
  ab_test_created: { tr: 'A/B Test Oluşturuldu', en: 'A/B Test Created' },
  plan_upgraded: { tr: 'Plan Yükseltildi', en: 'Plan Upgraded' },
  mission_completed: { tr: 'Görev Tamamlandı', en: 'Mission Completed' },
  performance_added: { tr: 'Performans Eklendi', en: 'Performance Added' },
};

export default function ActivityLogPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (filter) params.set('action', filter);

      const response = await fetch(`/api/activity?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setActivities(data.activities || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  if (!dictionary) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return locale === 'tr' ? 'Az önce' : 'Just now';
    if (diffMins < 60) return locale === 'tr' ? `${diffMins} dk önce` : `${diffMins}m ago`;
    if (diffHours < 24) return locale === 'tr' ? `${diffHours} saat önce` : `${diffHours}h ago`;
    if (diffDays < 7) return locale === 'tr' ? `${diffDays} gün önce` : `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const filterOptions = [
    { value: null, label: locale === 'tr' ? 'Tümü' : 'All' },
    { value: 'hook_generated', label: locale === 'tr' ? 'Hook' : 'Hooks' },
    { value: 'video_analyzed', label: locale === 'tr' ? 'Analiz' : 'Analysis' },
    { value: 'planner_created', label: locale === 'tr' ? 'Planlayıcı' : 'Planner' },
    { value: 'ab_test_created', label: 'A/B Test' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href={`/${locale}/account`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {locale === 'tr' ? 'Hesabıma Dön' : 'Back to Account'}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {locale === 'tr' ? 'Aktivite Geçmişi' : 'Activity Log'}
        </h1>
        <p className="text-gray-600 mt-1">
          {locale === 'tr'
            ? 'Platformdaki tüm aktivitelerinizi görüntüleyin'
            : 'View all your activity on the platform'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {filterOptions.map((option) => (
          <button
            key={option.value || 'all'}
            onClick={() => { setFilter(option.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === option.value
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            {locale === 'tr' ? 'Zaman Çizelgesi' : 'Timeline'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {locale === 'tr' ? 'Henüz aktivite yok' : 'No activity yet'}
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Activities */}
              <div className="space-y-6">
                {activities.map((activity, index) => {
                  const config = actionConfig[activity.action] || actionConfig.default;
                  const Icon = config.icon;
                  const label =
                    activity.action_label ||
                    actionLabels[activity.action]?.[locale as 'tr' | 'en'] ||
                    activity.action;

                  return (
                    <div key={activity.id} className="relative flex gap-4">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center z-10 flex-shrink-0`}
                      >
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-6">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{label}</span>
                          {activity.entity_type && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                              {activity.entity_type}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {getRelativeTime(activity.created_at)}
                        </p>
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(activity.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
