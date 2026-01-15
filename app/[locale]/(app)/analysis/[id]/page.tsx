'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ScoreCard } from '@/components/analysis/score-card';
import { IssuesSection } from '@/components/analysis/issues-section';
import { HooksSection } from '@/components/analysis/hooks-section';
import { EditingSection } from '@/components/analysis/editing-section';
import { CaptionsSection, TextSection } from '@/components/analysis/captions-section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Analysis, AnalysisResult } from '@/lib/types/database';

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const analysisId = params.id as string;
  const supabase = createClient();

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  useEffect(() => {
    const loadAnalysis = async () => {
      const { data } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (data) {
        setAnalysis(data);
      }
      setLoading(false);
    };

    loadAnalysis();

    // Subscribe to updates
    const channel = supabase
      .channel(`analysis-${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analyses',
          filter: `id=eq.${analysisId}`,
        },
        (payload) => {
          setAnalysis(payload.new as Analysis);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [analysisId, supabase]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, locale }),
      });

      if (!response.ok) {
        throw new Error('Retry failed');
      }
    } catch (error) {
      console.error('Retry error:', error);
    } finally {
      setRetrying(false);
    }
  };

  if (loading || !dictionary) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const t = dictionary;

  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">{t.common.error}</p>
        <div className="text-center mt-4">
          <Link href={`/${locale}/dashboard`}>
            <Button variant="outline">{t.analysis.backToDashboard}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const result = analysis.result_json as AnalysisResult | null;

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.common.back}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.analysis.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getStatusVariant(analysis.status)}>
                {t.analysis.status[analysis.status as keyof typeof t.analysis.status]}
              </Badge>
              {analysis.duration_sec && (
                <span className="text-sm text-gray-500">{analysis.duration_sec}s</span>
              )}
            </div>
          </div>
        </div>
        {analysis.status === 'failed' && (
          <Button onClick={handleRetry} isLoading={retrying}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t.analysis.tryAgain}
          </Button>
        )}
      </div>

      {/* Loading/Processing State */}
      {(analysis.status === 'queued' || analysis.status === 'processing') && (
        <div className="text-center py-20">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">{t.analysis.waitingForResults}</p>
        </div>
      )}

      {/* Failed State */}
      {analysis.status === 'failed' && !result && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-gray-900 font-semibold mb-2">{t.analysis.analysisFailed}</p>
          <p className="text-gray-600 mb-4">{t.common.error}</p>
        </div>
      )}

      {/* Results */}
      {analysis.status === 'done' && result && (
        <div className="space-y-8">
          {/* Score Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreCard label={t.analysis.scores.hookScore} value={result.hook_score} />
            <ScoreCard
              label={t.analysis.scores.retentionProbability}
              value={result.retention_probability}
            />
            <ScoreCard label={t.analysis.scores.viralPotential} value={result.viral_potential} />
            <ScoreCard label={t.analysis.scores.engagementScore} value={result.engagement_score} />
          </div>

          {/* Content Type */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">{t.analysis.contentType}</p>
            <p className="text-lg font-semibold text-gray-900">{result.content_type}</p>
          </div>

          {/* Issues */}
          <IssuesSection
            issues={result.key_issues}
            title={t.analysis.keyIssues}
            noIssuesText={t.analysis.noIssues}
          />

          {/* Recommended Hooks */}
          <HooksSection
            hooks={result.recommended_hooks}
            title={t.analysis.recommendedHooks}
            copyText={t.common.copy}
            copiedText={t.common.copied}
          />

          {/* Editing Instructions */}
          <EditingSection
            instructions={result.editing_instructions}
            title={t.analysis.editingInstructions}
            noInstructionsText={t.analysis.noEditingInstructions}
            timeRangeLabel={t.analysis.timeRange}
          />

          {/* On-Screen Text */}
          <TextSection
            items={result.on_screen_text}
            title={t.analysis.onScreenText}
            icon="text"
            copyText={t.common.copy}
            copiedText={t.common.copied}
          />

          {/* Cover Suggestions */}
          <TextSection
            items={result.cover_suggestions}
            title={t.analysis.coverSuggestions}
            icon="image"
            copyText={t.common.copy}
            copiedText={t.common.copied}
          />

          {/* Caption Suggestions */}
          <CaptionsSection
            captions={result.caption_suggestions}
            title={t.analysis.captionSuggestions}
            copyText={t.common.copy}
            copiedText={t.common.copied}
          />
        </div>
      )}
    </div>
  );
}
