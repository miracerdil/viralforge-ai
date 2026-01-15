'use client';

import Link from 'next/link';
import { formatDistanceToNow } from '@/lib/utils/date';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlatformBadge } from '@/components/ui/platform-selector';
import type { Analysis } from '@/lib/types/database';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import { FileVideo, ArrowRight } from 'lucide-react';

interface AnalysisListProps {
  analyses: Analysis[];
  dictionary: Dictionary;
  locale: string;
}

export function AnalysisList({ analyses, dictionary, locale }: AnalysisListProps) {
  const t = dictionary;

  const getStatusVariant = (status: Analysis['status']) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'processing':
        return 'info';
      case 'queued':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: Analysis['status']) => {
    return t.analysis.status[status] || status;
  };

  if (analyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.recentAnalyses}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileVideo className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t.dashboard.noAnalyses}</h3>
            <p className="text-sm text-gray-500">{t.dashboard.noAnalysesDescription}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboard.recentAnalyses}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <Link
              key={analysis.id}
              href={`/${locale}/analysis/${analysis.id}`}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileVideo className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <PlatformBadge platform={analysis.platform} dictionary={dictionary} />
                  <Badge variant={getStatusVariant(analysis.status)}>
                    {getStatusLabel(analysis.status)}
                  </Badge>
                  {analysis.duration_sec && (
                    <span className="text-xs text-gray-500">{analysis.duration_sec}s</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(analysis.created_at), locale)}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
