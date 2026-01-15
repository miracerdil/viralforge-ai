'use client';

import { useState } from 'react';
import { Zap, Lock, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { ShopItem } from '@/lib/types/shop';
import { SHOP_ITEM_IDS } from '@/lib/types/shop';

interface ShopItemCardProps {
  item: ShopItem;
  xpBalance: number;
  dictionary: Dictionary;
  onRedeem: (itemId: string) => Promise<void>;
  isRedeeming: boolean;
}

export function ShopItemCard({
  item,
  xpBalance,
  dictionary,
  onRedeem,
  isRedeeming,
}: ShopItemCardProps) {
  const t = dictionary.shop;
  const [showConfirm, setShowConfirm] = useState(false);

  const canAfford = xpBalance >= item.xp_cost;

  const itemInfo = t.items[item.id as keyof typeof t.items] || {
    name: item.id,
    description: '',
  };

  const getIcon = () => {
    if (item.id === SHOP_ITEM_IDS.ANALYSIS_CREDIT_1) {
      return <Zap className="w-6 h-6 text-blue-600" />;
    }
    return <Gift className="w-6 h-6 text-purple-600" />;
  };

  const getIconBg = () => {
    if (item.id === SHOP_ITEM_IDS.ANALYSIS_CREDIT_1) {
      return 'bg-blue-100';
    }
    return 'bg-purple-100';
  };

  const handleRedeemClick = () => {
    if (!canAfford) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    await onRedeem(item.id);
  };

  return (
    <Card className="relative overflow-hidden">
      {showConfirm && (
        <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center p-6">
          <p className="text-lg font-semibold text-gray-900 mb-2">{t.confirmRedeem}</p>
          <p className="text-gray-600 text-center mb-6">
            {t.confirmMessage.replace('{cost}', item.xp_cost.toString())}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              {dictionary.common.cancel}
            </Button>
            <Button onClick={handleConfirm} disabled={isRedeeming}>
              {isRedeeming ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {t.redeeming}
                </>
              ) : (
                t.redeem
              )}
            </Button>
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${getIconBg()} rounded-xl flex items-center justify-center`}>
            {getIcon()}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{itemInfo.name}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{itemInfo.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-xl font-bold text-amber-600">{item.xp_cost}</span>
            <span className="text-gray-500">{t.xpPoints}</span>
          </div>
          <Button
            onClick={handleRedeemClick}
            disabled={!canAfford || isRedeeming}
            variant={canAfford ? 'primary' : 'outline'}
            className={!canAfford ? 'opacity-50' : ''}
          >
            {!canAfford ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                {t.insufficientXp}
              </>
            ) : (
              t.redeem
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
