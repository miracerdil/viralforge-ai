'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { UserDetail } from '@/components/admin/user-detail';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { AdminUserView } from '@/lib/types/database';

interface StripeData {
  has_stripe: boolean;
  customer_id?: string;
  subscription?: {
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
  } | null;
  invoices: Array<{
    id: string;
    amount_due: number;
    amount_paid: number;
    currency: string;
    status: string;
    created: number;
    hosted_invoice_url: string;
  }>;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const userId = params.id as string;

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUserView | null>(null);
  const [stripeData, setStripeData] = useState<StripeData | null>(null);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      router.push(`/${locale}/admin`);
    }
  }, [userId, locale, router]);

  const fetchStripeData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/stripe`);
      if (response.ok) {
        const data = await response.json();
        setStripeData(data);
      }
    } catch (error) {
      console.error('Failed to fetch Stripe data:', error);
    }
  }, [userId]);

  useEffect(() => {
    Promise.all([fetchUser(), fetchStripeData()]).finally(() => setLoading(false));
  }, [fetchUser, fetchStripeData]);

  const handleUpdatePlan = async (plan: 'FREE' | 'PRO') => {
    const response = await fetch(`/api/admin/users/${userId}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (response.ok) {
      await fetchUser();
    }
  };

  const handleUpdateComped = async (comped_until: string | null) => {
    const response = await fetch(`/api/admin/users/${userId}/comped`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comped_until }),
    });
    if (response.ok) {
      await fetchUser();
    }
  };

  const handleToggleDisabled = async (is_disabled: boolean) => {
    const response = await fetch(`/api/admin/users/${userId}/disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_disabled }),
    });
    if (response.ok) {
      await fetchUser();
    }
  };

  const handleResetQuota = async () => {
    const response = await fetch(`/api/admin/users/${userId}/reset-quota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (response.ok) {
      await fetchUser();
    }
  };

  if (loading || !dictionary) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{dictionary.common.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {dictionary.common.back}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {dictionary.admin.userDetail.title}
        </h1>
      </div>

      <UserDetail
        user={user}
        stripeData={stripeData}
        locale={locale}
        dictionary={dictionary}
        onUpdatePlan={handleUpdatePlan}
        onUpdateComped={handleUpdateComped}
        onToggleDisabled={handleToggleDisabled}
        onResetQuota={handleResetQuota}
      />
    </div>
  );
}
