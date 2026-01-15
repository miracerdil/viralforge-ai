'use client';

import { useState } from 'react';
import { X, Crown, Check, Zap, Sparkles, Target } from 'lucide-react';
import { Button } from './button';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dictionary: Dictionary;
  locale: string;
  feature?: 'hooks' | 'planner' | 'analysis' | 'missions' | 'persona';
}

export function UpgradeModal({
  isOpen,
  onClose,
  dictionary,
  locale,
  feature = 'hooks',
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const t = dictionary.upgrade;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const benefits = t.benefits[feature] || t.benefits.default;
  const icons = [
    <Zap key="zap" className="w-5 h-5 text-amber-500" />,
    <Sparkles key="sparkles" className="w-5 h-5 text-purple-500" />,
    <Target key="target" className="w-5 h-5 text-green-500" />,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary-600 via-purple-600 to-accent-600 px-6 py-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t.title}</h2>
          <p className="text-white/80">{t.subtitle}</p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Benefits */}
          <div className="space-y-4 mb-6">
            {benefits.map((benefit: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{icons[index % icons.length]}</div>
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="text-center mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="text-sm text-gray-500 mb-1">{t.startingAt}</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-gray-900">{dictionary.pricing.pro.price}</span>
              <span className="text-gray-500">{dictionary.pricing.pro.period}</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleUpgrade}
            isLoading={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700"
          >
            <Crown className="w-5 h-5 mr-2" />
            {t.cta}
          </Button>

          {/* Features list */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
              {t.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
