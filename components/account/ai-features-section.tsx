'use client';

import { Brain, TrendingUp, Lock, CheckCircle, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { UserEntitlements } from '@/lib/types/entitlements';

interface AIFeaturesSectionProps {
  entitlements: UserEntitlements | null;
  locale: string;
  dictionary: Dictionary;
  onUpgrade: () => void;
  isComped?: boolean; // Comped users get PRO features
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive: boolean;
  locale: string;
  onUpgrade: () => void;
}

function FeatureCard({
  icon,
  title,
  description,
  isActive,
  locale,
  onUpgrade,
}: FeatureCardProps) {
  return (
    <div
      className={`relative p-4 rounded-xl border-2 transition-all ${
        isActive
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      {!isActive && (
        <div className="absolute inset-0 bg-gray-50/60 rounded-xl flex items-center justify-center z-10">
          <Button onClick={onUpgrade} size="sm" className="gap-1">
            <Crown className="w-3 h-3" />
            {locale === 'tr' ? 'PRO ile aç' : 'Unlock with PRO'}
          </Button>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg ${
            isActive ? 'bg-green-100' : 'bg-gray-200'
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {isActive ? (
              <Badge className="bg-green-100 text-green-700 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {locale === 'tr' ? 'Aktif' : 'Active'}
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-500 text-xs">
                <Lock className="w-3 h-3 mr-1" />
                PRO
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function AIFeaturesSection({
  entitlements,
  locale,
  dictionary,
  onUpgrade,
  isComped = false,
}: AIFeaturesSectionProps) {
  const t = dictionary.account || {};

  // Comped users get PRO features even if entitlements don't show it
  const personaEnabled = isComped || entitlements?.persona_enabled || false;
  const performanceEnabled = isComped || entitlements?.performance_tracking_enabled || false;

  const features = [
    {
      id: 'persona',
      icon: <Brain className={`w-5 h-5 ${personaEnabled ? 'text-green-600' : 'text-gray-400'}`} />,
      title: locale === 'tr' ? 'Kişiselleştirilmiş İçerik' : 'Persona Learning',
      description:
        locale === 'tr'
          ? 'AI içerik stilinizi öğrenir ve kişiselleştirilmiş öneriler sunar'
          : 'AI learns your content style and provides personalized suggestions',
      isActive: personaEnabled,
    },
    {
      id: 'performance',
      icon: <TrendingUp className={`w-5 h-5 ${performanceEnabled ? 'text-green-600' : 'text-gray-400'}`} />,
      title: locale === 'tr' ? 'Performans Optimizasyonu' : 'Performance Optimization',
      description:
        locale === 'tr'
          ? 'Geçmiş performansınıza göre içerik optimizasyonu'
          : 'Content optimization based on your past performance',
      isActive: performanceEnabled,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <span>{t.aiFeatures || (locale === 'tr' ? 'AI Özellikleri' : 'AI Features')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            isActive={feature.isActive}
            locale={locale}
            onUpgrade={onUpgrade}
          />
        ))}
      </CardContent>
    </Card>
  );
}
