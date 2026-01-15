'use client';

import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { XpLedgerEntry } from '@/lib/types/shop';

interface RedemptionHistoryProps {
  ledger: XpLedgerEntry[];
  totalEarned: number;
  totalSpent: number;
  dictionary: Dictionary;
  locale: string;
}

export function RedemptionHistory({
  ledger,
  totalEarned,
  totalSpent,
  dictionary,
  locale,
}: RedemptionHistoryProps) {
  const t = dictionary.shop;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceLabel = (source: string) => {
    const sourceKey = source as keyof typeof t.ledgerSources;
    return t.ledgerSources[sourceKey] || source;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          {t.history}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{t.earnedTotal}</span>
            </div>
            <p className="text-2xl font-bold text-green-700">+{totalEarned}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">{t.spentTotal}</span>
            </div>
            <p className="text-2xl font-bold text-red-700">-{totalSpent}</p>
          </div>
        </div>

        {/* Ledger List */}
        {ledger.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">{t.noHistory}</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ledger.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      entry.type === 'earn' ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {entry.type === 'earn' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getSourceLabel(entry.source)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(entry.created_at)}</p>
                  </div>
                </div>
                <span
                  className={`font-bold ${
                    entry.type === 'earn' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {entry.type === 'earn' ? '+' : '-'}{entry.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
