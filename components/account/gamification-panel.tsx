'use client';

import Link from 'next/link';
import { Zap, Flame, Gift, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface GamificationPanelProps {
  xpBalance: number;
  streakCount: number;
  locale: string;
  dictionary: Dictionary;
}

export function GamificationPanel({
  xpBalance,
  streakCount,
  locale,
  dictionary,
}: GamificationPanelProps) {
  const t = dictionary.account || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <span>{t.gamification || (locale === 'tr' ? 'Oyunlaştırma' : 'Gamification')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* XP Balance */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-700">
                {locale === 'tr' ? 'XP Bakiyesi' : 'XP Balance'}
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {xpBalance.toLocaleString()}
            </p>
          </div>

          {/* Streak */}
          <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">
                {locale === 'tr' ? 'Seri' : 'Streak'}
              </span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {streakCount} {locale === 'tr' ? 'gün' : 'days'}
            </p>
          </div>
        </div>

        {/* Go to Rewards Shop */}
        <Link href={`/${locale}/rewards`}>
          <Button variant="outline" className="w-full gap-2">
            <Gift className="w-4 h-4" />
            {t.goToShop || (locale === 'tr' ? 'Ödül Mağazasına Git' : 'Go to Reward Shop')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
