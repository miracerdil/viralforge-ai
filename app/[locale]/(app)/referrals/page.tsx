'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Gift, Clock, CheckCircle, XCircle, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { InviteCard } from '@/components/referral/InviteCard';
import { ReferralStats } from '@/components/referral/ReferralStats';
import { cn } from '@/lib/utils';

interface Referral {
  id: string;
  referral_code: string;
  status: string;
  signed_up_at: string | null;
  converted_at: string | null;
  created_at: string;
  referred_user: { email: string } | null;
}

interface Reward {
  id: string;
  reward_type: string;
  reward_value: number;
  reason: string;
  applied_at: string | null;
  created_at: string;
}

interface ReferralData {
  referralCode: string;
  referralCount: number;
  wasReferred: boolean;
  referrals: Referral[];
  rewards: Reward[];
  stats: {
    totalReferrals: number;
    signedUp: number;
    converted: number;
    totalXpEarned: number;
    totalCreditsEarned: number;
  };
}

export default function ReferralsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralData | null>(null);
  const [activeTab, setActiveTab] = useState<'referrals' | 'rewards'>('referrals');

  const t = {
    title: locale === 'tr' ? 'Referans Programı' : 'Referral Program',
    subtitle: locale === 'tr' ? 'Arkadaşlarını davet et, ödüller kazan!' : 'Invite friends, earn rewards!',
    referralsTab: locale === 'tr' ? 'Davetler' : 'Referrals',
    rewardsTab: locale === 'tr' ? 'Ödüller' : 'Rewards',
    noReferrals: locale === 'tr' ? 'Henüz davet yok' : 'No referrals yet',
    noRewards: locale === 'tr' ? 'Henüz ödül yok' : 'No rewards yet',
    status: {
      pending: locale === 'tr' ? 'Bekliyor' : 'Pending',
      signed_up: locale === 'tr' ? 'Kayıt Oldu' : 'Signed Up',
      converted: locale === 'tr' ? 'PRO Oldu' : 'Converted',
      expired: locale === 'tr' ? 'Süresi Doldu' : 'Expired',
    },
    rewardType: {
      xp: 'XP',
      usage_credit: locale === 'tr' ? 'Kullanım Kredisi' : 'Usage Credit',
    },
    reason: {
      signup: locale === 'tr' ? 'Kayıt Ödülü' : 'Signup Reward',
      conversion: locale === 'tr' ? 'Dönüşüm Ödülü' : 'Conversion Reward',
      milestone: locale === 'tr' ? 'Kilometre Taşı' : 'Milestone',
    },
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/referrals');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'converted':
        return <Crown className="w-4 h-4 text-purple-500" />;
      case 'signed_up':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

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

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load referral data</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
          <Gift className="w-7 h-7 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Invite Card */}
        <div>
          <InviteCard referralCode={data.referralCode} locale={locale} />
        </div>

        {/* Right Column - Stats & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <ReferralStats stats={data.stats} locale={locale} />

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('referrals')}
                className={cn(
                  'flex-1 py-3 px-4 text-sm font-medium transition-colors',
                  activeTab === 'referrals'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {t.referralsTab} ({data.referrals.length})
              </button>
              <button
                onClick={() => setActiveTab('rewards')}
                className={cn(
                  'flex-1 py-3 px-4 text-sm font-medium transition-colors',
                  activeTab === 'rewards'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {t.rewardsTab} ({data.rewards.length})
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'referrals' ? (
                data.referrals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">{t.noReferrals}</p>
                ) : (
                  <div className="space-y-3">
                    {data.referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(referral.status)}
                          <div>
                            <p className="font-medium text-gray-900">
                              {referral.referred_user?.email?.split('@')[0] || 'Pending...'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(referral.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'px-2.5 py-1 text-xs font-medium rounded-full',
                            getStatusColor(referral.status)
                          )}
                        >
                          {t.status[referral.status as keyof typeof t.status] || referral.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              ) : data.rewards.length === 0 ? (
                <p className="text-center text-gray-500 py-8">{t.noRewards}</p>
              ) : (
                <div className="space-y-3">
                  {data.rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {t.reason[reward.reason as keyof typeof t.reason] || reward.reason}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(reward.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-lg font-semibold text-amber-600">
                        +{reward.reward_value} {t.rewardType[reward.reward_type as keyof typeof t.rewardType] || reward.reward_type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
