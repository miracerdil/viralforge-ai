'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Bug, ExternalLink, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

interface BugReport {
  id: string;
  title: string;
  description: string;
  page_url: string;
  screenshot_url: string;
  severity: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: { email: string };
}

export default function AdminBugsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchBugs();
  }, [statusFilter]);

  const fetchBugs = async () => {
    let query = supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data: bugsData, error } = await query;

    if (error) {
      console.error('Error fetching bugs:', error);
      setLoading(false);
      return;
    }

    // Get user emails separately
    if (bugsData && bugsData.length > 0) {
      const userIds = [...new Set(bugsData.filter(b => b.user_id).map(b => b.user_id))];

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        const profileMap = new Map(profilesData?.map(p => [p.id, p.email]) || []);

        const bugsWithProfiles = bugsData.map(bug => ({
          ...bug,
          profiles: bug.user_id ? { email: profileMap.get(bug.user_id) || null } : null
        }));

        setBugs(bugsWithProfiles);
      } else {
        setBugs(bugsData);
      }
    } else {
      setBugs([]);
    }

    setLoading(false);
  };

  const updateStatus = async (bugId: string, newStatus: string) => {
    setUpdating(bugId);
    const updateData: any = { status: newStatus };
    if (newStatus === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('bug_reports')
      .update(updateData)
      .eq('id', bugId);

    if (!error) {
      setBugs((prev) =>
        prev.map((bug) => (bug.id === bugId ? { ...bug, status: newStatus } : bug))
      );
    }
    setUpdating(null);
  };

  const t = {
    title: locale === 'tr' ? 'Hata Raporları' : 'Bug Reports',
    subtitle: locale === 'tr' ? 'Kullanıcılardan gelen hata bildirimleri' : 'Bug reports from users',
    noBugs: locale === 'tr' ? 'Hata raporu yok' : 'No bug reports',
    statuses: {
      new: locale === 'tr' ? 'Yeni' : 'New',
      acknowledged: locale === 'tr' ? 'Kabul Edildi' : 'Acknowledged',
      in_progress: locale === 'tr' ? 'Yapılıyor' : 'In Progress',
      resolved: locale === 'tr' ? 'Çözüldü' : 'Resolved',
      wont_fix: locale === 'tr' ? 'Düzeltilmeyecek' : "Won't Fix",
      duplicate: locale === 'tr' ? 'Tekrar' : 'Duplicate',
    },
    severities: {
      low: locale === 'tr' ? 'Düşük' : 'Low',
      medium: locale === 'tr' ? 'Orta' : 'Medium',
      high: locale === 'tr' ? 'Yüksek' : 'High',
      critical: locale === 'tr' ? 'Kritik' : 'Critical',
    },
    all: locale === 'tr' ? 'Tümü' : 'All',
    viewScreenshot: locale === 'tr' ? 'Görsel' : 'Screenshot',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-700';
      case 'wont_fix':
        return 'bg-gray-100 text-gray-700';
      case 'duplicate':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-green-600 bg-green-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Bug className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-500">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setStatusFilter(null)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            statusFilter === null
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t.all}
        </button>
        {Object.entries(t.statuses).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              statusFilter === key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bug List */}
      {bugs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bug className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t.noBugs}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bugs.map((bug) => (
            <div
              key={bug.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{bug.title}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(bug.status)}`}>
                      {t.statuses[bug.status as keyof typeof t.statuses] || bug.status}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityColor(bug.severity)}`}>
                      {t.severities[bug.severity as keyof typeof t.severities] || bug.severity}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{bug.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{(bug.profiles as any)?.email || 'Unknown'}</span>
                    <span>{new Date(bug.created_at).toLocaleDateString()}</span>
                    {bug.page_url && (
                      <a
                        href={bug.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        URL
                      </a>
                    )}
                    {bug.screenshot_url && (
                      <a
                        href={bug.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {t.viewScreenshot}
                      </a>
                    )}
                  </div>
                </div>

                {/* Status selector */}
                <select
                  value={bug.status}
                  onChange={(e) => updateStatus(bug.id, e.target.value)}
                  disabled={updating === bug.id}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(t.statuses).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
