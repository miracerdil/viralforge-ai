'use client';

import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface XpBalanceCardProps {
  balance: number;
  dictionary: Dictionary;
}

export function XpBalanceCard({ balance, dictionary }: XpBalanceCardProps) {
  const t = dictionary.shop;

  return (
    <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-100 text-sm font-medium">{t.xpBalance}</p>
            <p className="text-4xl font-bold mt-1">
              {balance.toLocaleString()} <span className="text-2xl">{t.xpPoints}</span>
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
