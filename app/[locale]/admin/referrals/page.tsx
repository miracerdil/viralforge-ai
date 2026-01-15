'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Gift, Users, TrendingUp, Crown, Search, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReferralStats {
  totalReferrals: number;
  signedUp: number;
  converted: number;
  totalXpRewarded: number;
}

interface Referral {
  id: string;
  referrer_id: string;
  referral_code: string;
  referred_user_id: string | null;
  status: string;
  signed_up_at: string | null;
  converted_at: string | null;
  created_at: string;
  referrer: { email: string; name: string | null } | null;
  referred_user: { email: string; name: string | null } | null;
}

export default function AdminReferralsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    signedUp: 0,
    converted: 0,
    totalXpRewarded: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const t = {
    title: locale === 'tr' ? 'Referans Yönetimi' : 'Referral Management',
    subtitle: locale === 'tr' ? 'Kullanıcı referanslarını yönetin' : 'Manage user referrals',
    stats: {
      total: locale === 'tr' ? 'Toplam Referans' : 'Total Referrals',
      signedUp: locale === 'tr' ? 'Kayıt Olan' : 'Signed Up',
      converted: locale === 'tr' ? 'Dönüşen' : 'Converted',
      xpRewarded: locale === 'tr' ? 'Verilen XP' : 'XP Rewarded',
    },
    status: {
      pending: locale === 'tr' ? 'Bekliyor' : 'Pending',
      signed_up: locale === 'tr' ? 'Kayıt Oldu' : 'Signed Up',
      converted: locale === 'tr' ? 'Dönüştü' : 'Converted',
      expired: locale === 'tr' ? 'Süresi Doldu' : 'Expired',
    },
    all: locale === 'tr' ? 'Tümü' : 'All',
    search: locale === 'tr' ? 'E-posta ile ara...' : 'Search by email...',
    export: locale === 'tr' ? 'Dışa Aktar' : 'Export',
    noReferrals: locale === 'tr' ? 'Referans bulunamadı' : 'No referrals found',
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      let query = supabase
        .from('referrals')
        .select(`
          *,
          referrer:referrer_id(email, name),
          referred_user:referred_user_id(email, name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching referrals:', error);
      } else {
        setReferrals(data || []);

        // Calculate stats
        const allReferrals = data || [];
        setStats({
          totalReferrals: allReferrals.length,
          signedUp: allReferrals.filter((r) => r.status === 'signed_up' || r.status === 'converted').length,
          converted: allReferrals.filter((r) => r.status === 'converted').length,
          totalXpRewarded: allReferrals.length * 500 + allReferrals.filter((r) => r.status === 'converted').length * 1000,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReferrals = referrals.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.referrer?.email?.toLowerCase().includes(query) ||
      r.referred_user?.email?.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted':
        return 'bg-purple-100 text-purple-700';
      case 'signed_up':
        return 'bg-green-100 text-green-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
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
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Gift className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-500">{t.subtitle}</p>
          </div>
        </div>

        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          {t.export}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-500">{t.stats.total}</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">{t.stats.signedUp}</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{stats.signedUp}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-500">{t.stats.converted}</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{stats.converted}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-gray-500">{t.stats.xpRewarded}</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{stats.totalXpRewarded.toLocaleString()}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-2">
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
      </div>

      {/* Table */}
      {filteredReferrals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t.noReferrals}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Referans Veren' : 'Referrer'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Davet Edilen' : 'Referred'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Durum' : 'Status'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Tarih' : 'Date'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReferrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {referral.referrer?.name || referral.referrer?.email?.split('@')[0] || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">{referral.referrer?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {referral.referred_user ? (
                      <div>
                        <p className="font-medium text-gray-900">
                          {referral.referred_user.name || referral.referred_user.email?.split('@')[0]}
                        </p>
                        <p className="text-sm text-gray-500">{referral.referred_user.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">
                        {locale === 'tr' ? 'Henüz kayıt olmadı' : 'Not signed up yet'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', getStatusColor(referral.status))}>
                      {t.status[referral.status as keyof typeof t.status] || referral.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
