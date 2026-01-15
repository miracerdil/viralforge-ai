'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Gift } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { XpBalanceCard } from '@/components/shop/xp-balance-card';
import { ShopItemCard } from '@/components/shop/shop-item-card';
import { ActivePerks } from '@/components/shop/active-perks';
import { RedemptionHistory } from '@/components/shop/redemption-history';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { ShopItem, ShopStatus, ShopHistoryResponse } from '@/lib/types/shop';

export default function RewardsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const supabase = createClient();

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [status, setStatus] = useState<ShopStatus | null>(null);
  const [history, setHistory] = useState<ShopHistoryResponse | null>(null);
  const [redeemingItem, setRedeemingItem] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      // Complete onboarding step for visiting rewards shop
      try {
        await supabase.rpc('complete_onboarding_step', {
          p_user_id: user.id,
          p_step_key: 'visit_rewards_shop',
        });
      } catch (e) {
        // Ignore if already completed
      }

      setLoading(false);
    };

    checkAuth();
  }, [locale, router, supabase]);

  const fetchShopData = useCallback(async () => {
    try {
      const [itemsRes, statusRes, historyRes] = await Promise.all([
        fetch('/api/shop/items'),
        fetch('/api/shop/status'),
        fetch('/api/shop/history'),
      ]);

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data.items);
      }

      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch shop data:', error);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchShopData();
    }
  }, [loading, fetchShopData]);

  const handleRedeem = async (itemId: string) => {
    if (!dictionary) return;

    setRedeemingItem(itemId);
    setToast(null);

    try {
      const response = await fetch('/api/shop/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId }),
      });

      if (response.ok) {
        setToast({ type: 'success', message: dictionary.shop.redeemSuccess });
        await fetchShopData();
      } else {
        const error = await response.json();
        setToast({
          type: 'error',
          message: error.error || dictionary.shop.redeemError,
        });
      }
    } catch (error) {
      console.error('Redeem error:', error);
      setToast({ type: 'error', message: dictionary.shop.redeemError });
    } finally {
      setRedeemingItem(null);
    }
  };

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading || !dictionary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const t = dictionary.shop;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <Gift className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
      </div>

      {/* XP Balance */}
      <div className="mb-8">
        <XpBalanceCard balance={status?.xp_balance || 0} dictionary={dictionary} />
      </div>

      {/* Shop Items */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {items.map((item) => (
          <ShopItemCard
            key={item.id}
            item={item}
            xpBalance={status?.xp_balance || 0}
            dictionary={dictionary}
            onRedeem={handleRedeem}
            isRedeeming={redeemingItem === item.id}
          />
        ))}
      </div>

      {/* Active Perks and History */}
      <div className="grid md:grid-cols-2 gap-6">
        {status && <ActivePerks status={status} dictionary={dictionary} />}
        {history && (
          <RedemptionHistory
            ledger={history.ledger}
            totalEarned={history.total_earned}
            totalSpent={history.total_spent}
            dictionary={dictionary}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}
