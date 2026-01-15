'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, AlertTriangle, Crown } from 'lucide-react';
import { Button } from './button';
import type { UsageStatus, FeatureType } from '@/lib/types/entitlements';
import { UPGRADE_MESSAGES } from '@/lib/types/entitlements';

interface UsageToastProps {
  isOpen: boolean;
  onClose: () => void;
  feature: FeatureType;
  status: UsageStatus;
  remaining: number;
  locale: string;
  onUpgrade: () => void;
}

export function UsageToast({
  isOpen,
  onClose,
  feature,
  status,
  remaining,
  locale,
  onUpgrade,
}: UsageToastProps) {
  const [visible, setVisible] = useState(false);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      // Auto-close after 5 seconds for warning status
      if (status === 'warning') {
        const timer = setTimeout(handleClose, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, status, handleClose]);

  if (!isOpen) return null;

  const statusColors = {
    warning: 'bg-amber-50 border-amber-200',
    critical: 'bg-orange-50 border-orange-200',
    blocked: 'bg-red-50 border-red-200',
    ok: 'bg-green-50 border-green-200',
  };

  const statusIcons = {
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    critical: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    blocked: <AlertTriangle className="w-5 h-5 text-red-500" />,
    ok: null,
  };

  const messages = {
    warning: {
      tr: `Limitine yaklaşıyorsun — ${remaining} kullanım kaldı`,
      en: `Approaching limit — ${remaining} remaining`,
    },
    critical: {
      tr: `Limitine çok yakınsın — sadece ${remaining} kaldı`,
      en: `Very close to limit — only ${remaining} left`,
    },
    blocked: {
      tr: 'Limit doldu! Devam etmek için yükselt',
      en: 'Limit reached! Upgrade to continue',
    },
    ok: { tr: '', en: '' },
  };

  const upgradeMessage = UPGRADE_MESSAGES[feature]?.[locale as 'tr' | 'en'] || '';

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div
        className={`p-4 rounded-xl border shadow-lg ${statusColors[status]}`}
      >
        <div className="flex items-start gap-3">
          {statusIcons[status]}
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {messages[status][locale as 'tr' | 'en']}
            </p>
            {status !== 'ok' && (
              <p className="text-sm text-gray-600 mt-1">{upgradeMessage}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {(status === 'critical' || status === 'blocked') && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Button
              onClick={onUpgrade}
              size="sm"
              className="w-full gap-1"
            >
              <Crown className="w-4 h-4" />
              {locale === 'tr' ? 'PRO\'ya Yükselt' : 'Upgrade to PRO'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
