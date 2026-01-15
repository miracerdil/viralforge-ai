import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Zap, Sparkles, Video, Calendar, GitCompare, ExternalLink, Clock, Eye } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Get share info
  const { data: share, error: shareError } = await supabase
    .from('content_shares')
    .select('*')
    .eq('share_token', token)
    .eq('is_public', true)
    .single();

  if (shareError || !share) {
    notFound();
  }

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-600 mb-6">This share link has expired.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Try ViralForge AI
          </Link>
        </div>
      </div>
    );
  }

  // Increment view count
  await supabase
    .from('content_shares')
    .update({ view_count: (share.view_count || 0) + 1 })
    .eq('id', share.id);

  // Fetch the actual content
  let content: unknown = null;
  let contentError = null;

  switch (share.content_type) {
    case 'hooks': {
      const { data, error } = await supabase
        .from('generated_hooks')
        .select('*')
        .eq('id', share.content_id)
        .single();
      content = data;
      contentError = error;
      break;
    }
    case 'analysis': {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', share.content_id)
        .single();
      content = data;
      contentError = error;
      break;
    }
    case 'planner': {
      const { data, error } = await supabase
        .from('content_planners')
        .select('*')
        .eq('id', share.content_id)
        .single();
      content = data;
      contentError = error;
      break;
    }
    case 'ab_test': {
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('id', share.content_id)
        .single();
      content = data;
      contentError = error;
      break;
    }
  }

  if (contentError || !content) {
    notFound();
  }

  const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    hooks: { icon: Sparkles, label: 'Generated Hooks', color: 'text-purple-600' },
    analysis: { icon: Video, label: 'Video Analysis', color: 'text-blue-600' },
    planner: { icon: Calendar, label: 'Content Plan', color: 'text-green-600' },
    ab_test: { icon: GitCompare, label: 'A/B Test Results', color: 'text-amber-600' },
  };

  const config = typeConfig[share.content_type] || { icon: Sparkles, label: 'Content', color: 'text-gray-600' };
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">ViralForge AI</span>
          </Link>
          <Link
            href="/tr/signup"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Free
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Share Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center ${config.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {share.title || config.label}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {share.view_count || 0} views
                </span>
                <span>
                  Shared {new Date(share.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Display */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {share.content_type === 'hooks' && (
            <HooksContent content={content as HooksData} />
          )}
          {share.content_type === 'analysis' && (
            <AnalysisContent content={content as AnalysisData} />
          )}
          {share.content_type === 'planner' && (
            <PlannerContent content={content as PlannerData} />
          )}
          {share.content_type === 'ab_test' && (
            <ABTestContent content={content as ABTestData} />
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl p-6 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Create Your Own Viral Content</h2>
          <p className="text-primary-100 mb-4">
            Join thousands of content creators using AI to grow faster
          </p>
          <Link
            href="/tr/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
          >
            Start Free
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

// Content type definitions
interface HooksData {
  hooks: string[];
  platform: string;
  tone: string;
  created_at: string;
}

interface AnalysisData {
  result_json: {
    scores?: {
      hookScore?: number;
      retentionProbability?: number;
      viralPotential?: number;
    };
    contentType?: string;
    keyIssues?: string[];
    recommendedHooks?: string[];
  };
  created_at: string;
}

interface PlannerData {
  result_json: {
    days?: Array<{
      day: number;
      hook: string;
      scriptOutline: string;
    }>;
  };
  platform: string;
  created_at: string;
}

interface ABTestData {
  input_json: {
    optionA: string;
    optionB: string;
    type: string;
  };
  result_json: {
    winner: string;
    reasoning: string;
  };
  created_at: string;
}

// Content components
function HooksContent({ content }: { content: HooksData }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Generated Hooks</h2>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="px-2 py-1 bg-gray-100 rounded">{content.platform}</span>
        <span className="px-2 py-1 bg-gray-100 rounded">{content.tone}</span>
      </div>
      <div className="space-y-3">
        {content.hooks?.map((hook, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-900">{hook}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisContent({ content }: { content: AnalysisData }) {
  const result = content.result_json || {};
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Video Analysis Results</h2>

      {result.scores && (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-primary-600">{result.scores.hookScore || 0}</p>
            <p className="text-sm text-gray-500">Hook Score</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{result.scores.retentionProbability || 0}%</p>
            <p className="text-sm text-gray-500">Retention</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-accent-600">{result.scores.viralPotential || 0}%</p>
            <p className="text-sm text-gray-500">Viral Potential</p>
          </div>
        </div>
      )}

      {result.recommendedHooks && result.recommendedHooks.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Recommended Hooks</h3>
          <div className="space-y-2">
            {result.recommendedHooks.map((hook, i) => (
              <p key={i} className="p-3 bg-primary-50 text-primary-800 rounded-lg text-sm">
                {hook}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlannerContent({ content }: { content: PlannerData }) {
  const result = content.result_json || {};
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Content Plan</h2>
      <p className="text-sm text-gray-500">Platform: {content.platform}</p>

      <div className="space-y-4">
        {result.days?.map((day, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold">
                {day.day}
              </span>
              <span className="font-medium text-gray-900">Day {day.day}</span>
            </div>
            <p className="text-sm font-medium text-primary-600 mb-1">{day.hook}</p>
            <p className="text-sm text-gray-600">{day.scriptOutline}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ABTestContent({ content }: { content: ABTestData }) {
  const input = content.input_json || {};
  const result = content.result_json || {};

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">A/B Test Results</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg border-2 ${result.winner === 'A' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold">Option A</span>
            {result.winner === 'A' && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Winner</span>}
          </div>
          <p className="text-sm text-gray-700">{input.optionA}</p>
        </div>
        <div className={`p-4 rounded-lg border-2 ${result.winner === 'B' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold">Option B</span>
            {result.winner === 'B' && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Winner</span>}
          </div>
          <p className="text-sm text-gray-700">{input.optionB}</p>
        </div>
      </div>

      {result.reasoning && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Reasoning</h3>
          <p className="text-sm text-gray-600">{result.reasoning}</p>
        </div>
      )}
    </div>
  );
}
