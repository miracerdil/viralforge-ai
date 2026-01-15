'use client';

import { useState } from 'react';
import {
  Copy,
  Check,
  Clock,
  Hash,
  Video,
  MessageSquare,
  Type,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShareButton } from '@/components/sharing/share-button';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { PlanItem } from '@/lib/types/planner';

interface PlanCardProps {
  item: PlanItem;
  locale: string;
  dictionary: Dictionary;
  isLocked?: boolean;
}

export function PlanCard({ item, locale, dictionary, isLocked = false }: PlanCardProps) {
  const t = dictionary.planner;
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const copyToClipboard = async (text: string, field: string) => {
    if (isLocked) return;
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const dayLabels: Record<number, { tr: string; en: string }> = {
    1: { tr: 'Pazartesi', en: 'Monday' },
    2: { tr: 'Salı', en: 'Tuesday' },
    3: { tr: 'Çarşamba', en: 'Wednesday' },
    4: { tr: 'Perşembe', en: 'Thursday' },
    5: { tr: 'Cuma', en: 'Friday' },
    6: { tr: 'Cumartesi', en: 'Saturday' },
    7: { tr: 'Pazar', en: 'Sunday' },
  };

  if (isLocked) {
    return (
      <>
        <Card
          className="relative overflow-hidden cursor-pointer"
          onClick={() => setShowUpgradeModal(true)}
        >
          <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">{t.upgradeToView}</p>
            </div>
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="text-sm">
                {t.day} {item.day_index} - {dayLabels[item.day_index]?.[locale as 'tr' | 'en']}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="blur-sm">
            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.hook}</p>
          </CardContent>
        </Card>
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          dictionary={dictionary}
          locale={locale}
          feature="planner"
        />
      </>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="default" className="text-sm">
            {t.day} {item.day_index} - {dayLabels[item.day_index]?.[locale as 'tr' | 'en']}
          </Badge>
          <div className="flex items-center gap-3">
            <ShareButton
              type="planner"
              data={{
                dayTitle: `${t.day} ${item.day_index} - ${dayLabels[item.day_index]?.[locale as 'tr' | 'en']}`,
                contentType: item.title,
                hook: item.hook,
                tip1: item.script_outline[0] || '',
                tip2: item.cta,
              }}
              locale={locale}
              dictionary={dictionary}
            />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              {item.estimated_duration_seconds}s
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <h3 className="font-semibold text-lg text-gray-900">{item.title}</h3>

        {/* Hook */}
        <div className="bg-primary-50 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-primary-600 mb-1">{t.hook}</p>
              <p className="text-gray-900 font-medium">{item.hook}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(item.hook, 'hook')}
              className="shrink-0"
            >
              {copiedField === 'hook' ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expandable Content */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full justify-between"
        >
          {expanded ? t.showLess : t.showMore}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {expanded && (
          <div className="space-y-4">
            {/* Script Outline */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">{t.scriptOutline}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(item.script_outline.join('\n'), 'script')}
                >
                  {copiedField === 'script' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                {item.script_outline.map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary-600">•</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {/* Shot List */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">{t.shotList}</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                {item.shot_list.map((shot, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gray-400">{i + 1}.</span>
                    {shot}
                  </li>
                ))}
              </ul>
            </div>

            {/* On-Screen Text */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Type className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">{t.onScreenText}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.on_screen_text.map((text, i) => (
                  <Badge key={i} variant="secondary">
                    {text}
                  </Badge>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-medium text-amber-600 mb-1">{t.cta}</p>
              <p className="text-gray-900">{item.cta}</p>
            </div>

            {/* Hashtags */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">{t.hashtags}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(item.hashtags.join(' '), 'hashtags')}
                >
                  {copiedField === 'hashtags' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {item.hashtags.map((tag, i) => (
                  <span key={i} className="text-sm text-primary-600">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
