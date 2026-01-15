'use client';

import { useEffect, useState } from 'react';
import { Zap, Gift, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { ShopStatus } from '@/lib/types/shop';

interface ActivePerksProps {
  status: ShopStatus;
  dictionary: Dictionary;
}

function formatTimeRemaining(seconds: number, dictionary: Dictionary): string {
  const t = dictionary.shop;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}${t.hours}`);
  if (minutes > 0) parts.push(`${minutes}${t.minutes}`);
  if (hours === 0 && secs > 0) parts.push(`${secs}${t.seconds}`);

  return parts.join(' ');
}

export function ActivePerks({ status, dictionary }: ActivePerksProps) {
  const t = dictionary.shop;
  const [remainingSeconds, setRemainingSeconds] = useState(status.premium_hooks_remaining_seconds);

  useEffect(() => {
    setRemainingSeconds(status.premium_hooks_remaining_seconds);
  }, [status.premium_hooks_remaining_seconds]);

  useEffect(() => {
    if (!remainingSeconds || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const hasPerks = status.analysis_credit_balance > 0 || (remainingSeconds && remainingSeconds > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-600" />
          {t.activePerks}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasPerks ? (
          <p className="text-gray-500 text-sm">{t.noActivePerks}</p>
        ) : (
          <div className="space-y-4">
            {status.analysis_credit_balance > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{t.analysisCredits}</p>
                  <p className="text-sm text-gray-500">{t.analysisCreditsDesc}</p>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {status.analysis_credit_balance}
                </div>
              </div>
            )}

            {remainingSeconds && remainingSeconds > 0 && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{t.premiumHooksActive}</p>
                  <p className="text-sm text-gray-500">{t.premiumHooksDesc}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-purple-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-bold">
                      {formatTimeRemaining(remainingSeconds, dictionary)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
