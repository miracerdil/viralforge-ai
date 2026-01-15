'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Handshake, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { ApplicationForm } from '@/components/affiliate/ApplicationForm';
import { DashboardStats } from '@/components/affiliate/DashboardStats';
import { cn } from '@/lib/utils';

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

export default function AffiliatePage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AffiliateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = {
    title: locale === 'tr' ? 'Affiliate Programı' : 'Affiliate Program',
    subtitle: locale === 'tr' ? 'Ürünlerimizi tanıtın, komisyon kazanın!' : 'Promote our products, earn commissions!',
    pending: {
      title: locale === 'tr' ? 'Başvurunuz İnceleniyor' : 'Application Under Review',
      description: locale === 'tr'
        ? 'Başvurunuz inceleme aşamasındadır. Genellikle 1-2 iş günü içinde yanıt verilir.'
        : 'Your application is being reviewed. We typically respond within 1-2 business days.',
    },
    rejected: {
      title: locale === 'tr' ? 'Başvuru Reddedildi' : 'Application Rejected',
      description: locale === 'tr'
        ? 'Maalesef başvurunuz reddedildi. Detaylar için destek ekibimizle iletişime geçin.'
        : 'Unfortunately, your application was rejected. Please contact support for details.',
    },
    suspended: {
      title: locale === 'tr' ? 'Hesap Askıya Alındı' : 'Account Suspended',
      description: locale === 'tr'
        ? 'Affiliate hesabınız askıya alınmıştır. Destek ekibimizle iletişime geçin.'
        : 'Your affiliate account has been suspended. Please contact support.',
    },
    conversions: locale === 'tr' ? 'Son Dönüşümler' : 'Recent Conversions',
    noConversions: locale === 'tr' ? 'Henüz dönüşüm yok' : 'No conversions yet',
    conversionStatus: {
      pending: locale === 'tr' ? 'Bekliyor' : 'Pending',
      approved: locale === 'tr' ? 'Onaylandı' : 'Approved',
      paid: locale === 'tr' ? 'Ödendi' : 'Paid',
      refunded: locale === 'tr' ? 'İade' : 'Refunded',
    },
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/affiliate');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (formData: {
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
        // Refresh data
        await fetchData();
      } else {
        const result = await response.json();
        setError(result.error);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setError('Failed to submit application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'refunded':
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

  // Not an affiliate - show application form
  if (!data?.isAffiliate) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
            <Handshake className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-500">{t.subtitle}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        <ApplicationForm locale={locale} onSubmit={handleApply} />
      </div>
    );
  }

  const affiliate = data.affiliate!;

  // Pending application
  if (affiliate.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.pending.title}</h1>
        <p className="text-gray-600">{t.pending.description}</p>
        <p className="text-sm text-gray-500 mt-4">
          {locale === 'tr' ? 'Başvuru tarihi:' : 'Applied:'} {new Date(affiliate.createdAt).toLocaleDateString()}
        </p>
      </div>
    );
  }

  // Rejected
  if (affiliate.status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.rejected.title}</h1>
        <p className="text-gray-600">{t.rejected.description}</p>
      </div>
    );
  }

  // Suspended
  if (affiliate.status === 'suspended') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.suspended.title}</h1>
        <p className="text-gray-600">{t.suspended.description}</p>
      </div>
    );
  }

  // Approved - show dashboard
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
          <Handshake className="w-7 h-7 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats affiliate={affiliate} locale={locale} />

      {/* Recent Conversions */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{t.conversions}</h3>
        </div>

        {data.conversions && data.conversions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {data.conversions.map((conversion: any) => (
              <div
                key={conversion.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{conversion.plan_type}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(conversion.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-green-600">
                    +${conversion.commission_amount.toFixed(2)}
                  </span>
                  <span className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-full',
                    getStatusColor(conversion.status)
                  )}>
                    {t.conversionStatus[conversion.status as keyof typeof t.conversionStatus] || conversion.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            {t.noConversions}
          </div>
        )}
      </div>
    </div>
  );
}
