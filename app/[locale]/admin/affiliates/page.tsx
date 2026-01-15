'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Handshake, DollarSign, Users, TrendingUp, Check, X, Eye, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  status: string;
  commission_rate: number;
  total_clicks: number;
  total_conversions: number;
  total_earnings: number;
  total_paid: number;
  pending_balance: number;
  application_note: string | null;
  created_at: string;
  user: { email: string; name: string | null } | null;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  totalEarnings: number;
  pendingPayouts: number;
}

export default function AdminAffiliatesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    totalEarnings: 0,
    pendingPayouts: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);

  const t = {
    title: locale === 'tr' ? 'Affiliate Yönetimi' : 'Affiliate Management',
    subtitle: locale === 'tr' ? 'Affiliate başvurularını yönetin' : 'Manage affiliate applications',
    stats: {
      total: locale === 'tr' ? 'Toplam Affiliate' : 'Total Affiliates',
      pending: locale === 'tr' ? 'Bekleyen' : 'Pending',
      approved: locale === 'tr' ? 'Onaylı' : 'Approved',
      earnings: locale === 'tr' ? 'Toplam Kazanç' : 'Total Earnings',
      pendingPayouts: locale === 'tr' ? 'Bekleyen Ödemeler' : 'Pending Payouts',
    },
    status: {
      pending: locale === 'tr' ? 'Bekliyor' : 'Pending',
      approved: locale === 'tr' ? 'Onaylı' : 'Approved',
      rejected: locale === 'tr' ? 'Reddedildi' : 'Rejected',
      suspended: locale === 'tr' ? 'Askıda' : 'Suspended',
    },
    all: locale === 'tr' ? 'Tümü' : 'All',
    approve: locale === 'tr' ? 'Onayla' : 'Approve',
    reject: locale === 'tr' ? 'Reddet' : 'Reject',
    viewDetails: locale === 'tr' ? 'Detaylar' : 'Details',
    noAffiliates: locale === 'tr' ? 'Affiliate bulunamadı' : 'No affiliates found',
    applicationNote: locale === 'tr' ? 'Başvuru Notu' : 'Application Note',
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      let query = supabase
        .from('affiliates')
        .select(`
          *,
          user:user_id(email, name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching affiliates:', error);
      } else {
        setAffiliates(data || []);

        // Calculate stats
        const all = data || [];
        setStats({
          total: all.length,
          pending: all.filter((a) => a.status === 'pending').length,
          approved: all.filter((a) => a.status === 'approved').length,
          totalEarnings: all.reduce((sum, a) => sum + (a.total_earnings || 0), 0),
          pendingPayouts: all.reduce((sum, a) => sum + (a.pending_balance || 0), 0),
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (affiliateId: string, newStatus: string) => {
    setUpdatingId(affiliateId);

    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'approved') {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.id;
      }

      const { error } = await supabase
        .from('affiliates')
        .update(updateData)
        .eq('id', affiliateId);

      if (!error) {
        setAffiliates((prev) =>
          prev.map((a) => (a.id === affiliateId ? { ...a, status: newStatus } : a))
        );
        // Recalculate stats
        const updated = affiliates.map((a) => (a.id === affiliateId ? { ...a, status: newStatus } : a));
        setStats({
          ...stats,
          pending: updated.filter((a) => a.status === 'pending').length,
          approved: updated.filter((a) => a.status === 'approved').length,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'suspended':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Handshake className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-500">{t.stats.total}</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-gray-500">{t.stats.pending}</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{stats.pending}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">{t.stats.approved}</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{stats.approved}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-gray-500">{t.stats.earnings}</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">${stats.totalEarnings.toFixed(2)}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-gray-500">{t.stats.pendingPayouts}</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">${stats.pendingPayouts.toFixed(2)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setStatusFilter(null)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-lg transition-colors',
            statusFilter === null
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {t.all}
        </button>
        {Object.entries(t.status).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              statusFilter === key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {affiliates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Handshake className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t.noAffiliates}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Affiliate' : 'Affiliate'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Kod' : 'Code'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Tıklama' : 'Clicks'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Dönüşüm' : 'Conversions'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Kazanç' : 'Earnings'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Durum' : 'Status'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'İşlemler' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {affiliates.map((affiliate) => (
                <tr key={affiliate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {affiliate.user?.name || affiliate.user?.email?.split('@')[0] || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">{affiliate.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {affiliate.affiliate_code}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">
                    {affiliate.total_clicks}
                  </td>
                  <td className="px-6 py-4 text-center font-medium">
                    {affiliate.total_conversions}
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-green-600">
                    ${affiliate.total_earnings.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', getStatusColor(affiliate.status))}>
                      {t.status[affiliate.status as keyof typeof t.status] || affiliate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {affiliate.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(affiliate.id, 'approved')}
                            disabled={updatingId === affiliate.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            {updatingId === affiliate.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatus(affiliate.id, 'rejected')}
                            disabled={updatingId === affiliate.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAffiliate(affiliate)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedAffiliate(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedAffiliate.user?.name || selectedAffiliate.user?.email}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">{locale === 'tr' ? 'Kod' : 'Code'}</label>
                  <p className="font-mono font-medium">{selectedAffiliate.affiliate_code}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{locale === 'tr' ? 'Komisyon' : 'Commission'}</label>
                  <p className="font-medium">{selectedAffiliate.commission_rate}%</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{locale === 'tr' ? 'Toplam Kazanç' : 'Total Earnings'}</label>
                  <p className="font-medium text-green-600">${selectedAffiliate.total_earnings.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">{locale === 'tr' ? 'Bekleyen' : 'Pending'}</label>
                  <p className="font-medium">${selectedAffiliate.pending_balance.toFixed(2)}</p>
                </div>
              </div>

              {selectedAffiliate.application_note && (
                <div>
                  <label className="text-sm text-gray-500">{t.applicationNote}</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{selectedAffiliate.application_note}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedAffiliate(null)}>
                  {locale === 'tr' ? 'Kapat' : 'Close'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
