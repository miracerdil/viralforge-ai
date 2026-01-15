'use client';

import { useState } from 'react';
import { Copy, Check, Heart, Share2 } from 'lucide-react';
import { ShareLinkButton } from '@/components/sharing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { HookWithFavorite } from '@/lib/types/hooks';

interface HookCardProps {
  hook: HookWithFavorite;
  locale: string;
  dictionary: Dictionary;
  onToggleFavorite: (hookId: string, isFavorite: boolean) => Promise<void>;
  disabled?: boolean;
}

export function HookCard({
  hook,
  locale,
  dictionary,
  onToggleFavorite,
  disabled = false,
}: HookCardProps) {
  const t = dictionary.hooks;
  const [copied, setCopied] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(hook.hook_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFavorite = async () => {
    if (favoriting) return;
    if (disabled) {
      setShowUpgradeModal(true);
      return;
    }
    setFavoriting(true);
    try {
      await onToggleFavorite(hook.id, hook.is_favorite);
    } finally {
      setFavoriting(false);
    }
  };

  const nicheLabels: Record<string, { tr: string; en: string }> = {
    fitness: { tr: 'Fitness', en: 'Fitness' },
    beauty: { tr: 'Güzellik', en: 'Beauty' },
    ecommerce: { tr: 'E-ticaret', en: 'E-commerce' },
    education: { tr: 'Eğitim', en: 'Education' },
    motivation: { tr: 'Motivasyon', en: 'Motivation' },
    food: { tr: 'Yemek', en: 'Food' },
    travel: { tr: 'Seyahat', en: 'Travel' },
    gaming: { tr: 'Oyun', en: 'Gaming' },
    general: { tr: 'Genel', en: 'General' },
  };

  const toneLabels: Record<string, { tr: string; en: string }> = {
    funny: { tr: 'Eğlenceli', en: 'Funny' },
    serious: { tr: 'Ciddi', en: 'Serious' },
    educational: { tr: 'Eğitici', en: 'Educational' },
    controversial: { tr: 'Tartışmalı', en: 'Controversial' },
    inspirational: { tr: 'İlham Verici', en: 'Inspirational' },
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-gray-900 font-medium mb-3">{hook.hook_text}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {nicheLabels[hook.niche]?.[locale as 'tr' | 'en'] || hook.niche}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {toneLabels[hook.tone]?.[locale as 'tr' | 'en'] || hook.tone}
              </Badge>
              {hook.is_generated && (
                <Badge variant="info" className="text-xs">
                  AI
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              disabled={favoriting}
              className={hook.is_favorite ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}
            >
              <Heart
                className={`w-4 h-4 ${hook.is_favorite ? 'fill-current' : ''}`}
              />
            </Button>
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <ShareLinkButton
              contentType="hooks"
              contentId={hook.id}
              title={hook.hook_text.slice(0, 50)}
              locale={locale}
            />
          </div>
        </div>
      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        dictionary={dictionary}
        locale={locale}
        feature="hooks"
      />
    </>
  );
}
