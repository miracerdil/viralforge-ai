'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User, History, Gift, Handshake } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PlanStatusCard } from '@/components/account/plan-status-card';
import { UsageLimitsSection } from '@/components/account/usage-limits-section';
import { AIFeaturesSection } from '@/components/account/ai-features-section';
import { GamificationPanel } from '@/components/account/gamification-panel';
import { AccountInfoSection } from '@/components/account/account-info-section';
import { PlanComparisonModal } from '@/components/account/plan-comparison-modal';
import { ActivityTimeline } from '@/components/activity';
import { InviteCard } from '@/components/referral/InviteCard';
import { ReferralStats } from '@/components/referral/ReferralStats';
import { ApplicationForm } from '@/components/affiliate/ApplicationForm';
import { DashboardStats } from '@/components/affiliate/DashboardStats';
import { Spinner } from '@/components/ui/spinner';
import { getUsageSummary } from '@/lib/services/entitlements';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { UserEntitlements, UsageSummary, UserLifecycle } from '@/lib/types/entitlements';

type AccountTab = 'account' | 'activity' | 'referrals' | 'affiliate';

interface Profile {
  id: string;
  email: string;
  name?: string;
  plan: string;
  comped_until?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  category_group?: string;
  referral_code?: string;
}

interface ReferralData {
  referralCode: string;
  referralCount: number;
  wasReferred: boolean;
  referrals: any[];
  rewards: any[];
  stats: {
    totalReferrals: number;
    signedUp: number;
    converted: number;
    totalXpEarned: number;
    totalCreditsEarned: number;
  };
}

interface AffiliateData {
  isAffiliate: boolean;
  affiliate?: {
    id: string;
    affiliateCode: string;
    status: string;
    commissionRate: number;
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    totalPaid: number;
    pendingBalance: number;
    payoutMethod: string | null;
    minPayoutAmount: number;
    createdAt: string;
  };
  conversions?: any[];
  recentClicks?: any[];
  clicksByDay?: Record<string, number>;
  payouts?: any[];
}

export default function AccountPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const supabase = createClient();

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [lifecycle, setLifecycle] = useState<UserLifecycle | null>(null);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [xpBalance, setXpBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountTab>(
    (searchParams.get('tab') as AccountTab) || 'account'
  );
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [affiliateLoading, setAffiliateLoading] = useState(false);

  const handleTabChange = (tab: AccountTab) => {
    setActiveTab(tab);
    router.push(`/${locale}/account?tab=${tab}`, { scroll: false });

    // Load data for specific tabs
    if (tab === 'referrals' && !referralData) {
      fetchReferralData();
    }
    if (tab === 'affiliate' && !affiliateData) {
      fetchAffiliateData();
    }
  };

  const fetchReferralData = async () => {
    setReferralLoading(true);
    try {
      const response = await fetch('/api/referrals');
      if (response.ok) {
        const result = await response.json();
        setReferralData(result);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setReferralLoading(false);
    }
  };

  const fetchAffiliateData = async () => {
    setAffiliateLoading(true);
    try {
      const response = await fetch('/api/affiliate');
      if (response.ok) {
        const result = await response.json();
        setAffiliateData(result);
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setAffiliateLoading(false);
    }
  };

  const handleAffiliateApply = async (formData: {
    applicationNote: string;
    payoutMethod: string;
    payoutDetails: Record<string, string>;
  }) => {
    try {
      const response = await fetch('/api/affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        fetchAffiliateData();
      }
    } catch (error) {
      console.error('Error applying for affiliate:', error);
    }
  };

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  // Load data for tab if navigated directly via URL
  useEffect(() => {
    if (activeTab === 'referrals' && !referralData && !referralLoading) {
      fetchReferralData();
    }
    if (activeTab === 'affiliate' && !affiliateData && !affiliateLoading) {
      fetchAffiliateData();
    }
  }, [activeTab]);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Load entitlements
      const { data: entitlementsData } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (entitlementsData) {
        setEntitlements(entitlementsData as UserEntitlements);
        setUsageSummary(getUsageSummary(entitlementsData as UserEntitlements));
      }

      // Load lifecycle
      const { data: lifecycleData } = await supabase
        .from('user_lifecycle')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (lifecycleData) {
        setLifecycle(lifecycleData as UserLifecycle);
      }

      // Load XP balance
      const { data: xpData } = await supabase
        .from('xp_ledger')
        .select('amount')
        .eq('user_id', user.id);

      if (xpData) {
        const total = xpData.reduce((sum, entry) => sum + (entry.amount || 0), 0);
        setXpBalance(total);
      }

      setLoading(false);
    };

    loadData();
  }, [supabase]);

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  };

  if (loading || !dictionary) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const t = dictionary.account || {
    title: locale === 'tr' ? 'Hesabım' : 'My Account',
    subtitle: locale === 'tr' ? 'Plan ve kullanım bilgileriniz' : 'Your plan and usage info',
  };

  const tabs = [
    {
      id: 'account' as AccountTab,
      label: locale === 'tr' ? 'Hesap' : 'Account',
      icon: User,
    },
    {
      id: 'activity' as AccountTab,
      label: locale === 'tr' ? 'Aktivite' : 'Activity',
      icon: History,
    },
    {
      id: 'referrals' as AccountTab,
      label: locale === 'tr' ? 'Referanslar' : 'Referrals',
      icon: Gift,
    },
    {
      id: 'affiliate' as AccountTab,
      label: 'Affiliate',
      icon: Handshake,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-600 mt-1">{t.subtitle}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Plan Status Card */}
          <PlanStatusCard
            profile={profile}
            locale={locale}
            dictionary={dictionary}
            onUpgrade={() => setShowUpgradeModal(true)}
            onManage={handleManageSubscription}
          />

          {/* Usage Limits Section */}
          {usageSummary && (
            <UsageLimitsSection
              usageSummary={usageSummary}
              locale={locale}
              dictionary={dictionary}
              onUpgrade={() => setShowUpgradeModal(true)}
            />
          )}

          {/* AI Features Section */}
          <AIFeaturesSection
            entitlements={entitlements}
            locale={locale}
            dictionary={dictionary}
            onUpgrade={() => setShowUpgradeModal(true)}
            isComped={!!profile?.comped_until && new Date(profile.comped_until) > new Date()}
          />

          {/* Gamification Panel */}
          <GamificationPanel
            xpBalance={xpBalance}
            streakCount={lifecycle?.streak_count || 0}
            locale={locale}
            dictionary={dictionary}
          />

          {/* Account Info Section */}
          <AccountInfoSection
            profile={profile}
            locale={locale}
            dictionary={dictionary}
            onLogout={handleLogout}
          />
        </div>
      )}

      {activeTab === 'activity' && (
        <ActivityTimeline locale={locale} dictionary={dictionary} />
      )}

      {activeTab === 'referrals' && (
        <div className="space-y-6">
          {referralLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : referralData ? (
            <>
              <InviteCard
                referralCode={referralData.referralCode}
                locale={locale}
              />
              <ReferralStats stats={referralData.stats} locale={locale} />
              {referralData.referrals.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      {locale === 'tr' ? 'Davetlerim' : 'My Referrals'}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {referralData.referrals.slice(0, 5).map((ref: any) => (
                      <div key={ref.id} className="px-6 py-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {ref.referred_user?.email || (locale === 'tr' ? 'Bekliyor' : 'Pending')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          ref.status === 'converted' ? 'bg-purple-100 text-purple-700' :
                          ref.status === 'signed_up' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {ref.status === 'converted' ? (locale === 'tr' ? 'PRO Oldu' : 'Converted') :
                           ref.status === 'signed_up' ? (locale === 'tr' ? 'Kayıt Oldu' : 'Signed Up') :
                           (locale === 'tr' ? 'Bekliyor' : 'Pending')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {locale === 'tr' ? 'Referans verisi yüklenemedi' : 'Failed to load referral data'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'affiliate' && (
        <div className="space-y-6">
          {affiliateLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : affiliateData?.isAffiliate && affiliateData.affiliate ? (
            affiliateData.affiliate.status === 'approved' ? (
              <DashboardStats
                affiliate={affiliateData.affiliate}
                locale={locale}
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                {affiliateData.affiliate.status === 'pending' && (
                  <>
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Handshake className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {locale === 'tr' ? 'Başvurunuz İnceleniyor' : 'Application Under Review'}
                    </h3>
                    <p className="text-gray-500">
                      {locale === 'tr'
                        ? 'Başvurunuz inceleme aşamasındadır. Genellikle 1-2 iş günü içinde yanıt verilir.'
                        : 'Your application is being reviewed. We typically respond within 1-2 business days.'}
                    </p>
                  </>
                )}
                {affiliateData.affiliate.status === 'rejected' && (
                  <>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Handshake className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {locale === 'tr' ? 'Başvuru Reddedildi' : 'Application Rejected'}
                    </h3>
                    <p className="text-gray-500">
                      {locale === 'tr'
                        ? 'Maalesef başvurunuz reddedildi. Detaylar için destek ekibimizle iletişime geçin.'
                        : 'Unfortunately, your application was rejected. Please contact support for details.'}
                    </p>
                  </>
                )}
              </div>
            )
          ) : (
            <ApplicationForm onSubmit={handleAffiliateApply} locale={locale} />
          )}
        </div>
      )}

      {/* Plan Comparison Modal */}
      <PlanComparisonModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={entitlements?.plan || 'free'}
        locale={locale}
        dictionary={dictionary}
      />
    </div>
  );
}
