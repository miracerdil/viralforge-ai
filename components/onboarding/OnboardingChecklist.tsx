'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface OnboardingStep {
  step_key: string;
  title_tr: string;
  title_en: string;
  description_tr: string;
  description_en: string;
  xp_reward: number;
  icon: string;
  action_url: string;
  action_label_tr: string;
  action_label_en: string;
  is_completed: boolean;
  completed_at: string | null;
}

interface OnboardingChecklistProps {
  locale: string;
  onDismiss?: () => void;
}

export function OnboardingChecklist({ locale, onDismiss }: OnboardingChecklistProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    fetchOnboarding();
  }, []);

  const fetchOnboarding = async () => {
    try {
      const response = await fetch('/api/onboarding');
      const data = await response.json();
      setSteps(data.steps || []);
      setProgress(data.progress || 0);
      setIsComplete(data.isComplete || false);
    } catch (error) {
      console.error('Error fetching onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.CheckCircle;
    return Icon;
  };

  const t = {
    title: locale === 'tr' ? 'Başlangıç Rehberi' : 'Getting Started',
    subtitle: locale === 'tr' ? 'Adımları tamamlayarak XP kazan!' : 'Complete steps to earn XP!',
    completed: locale === 'tr' ? 'Tamamlandı' : 'Completed',
    xp: 'XP',
    dismiss: locale === 'tr' ? 'Kapat' : 'Dismiss',
    allComplete: locale === 'tr' ? 'Tebrikler! Tüm adımları tamamladın!' : 'Congratulations! You completed all steps!',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </div>
    );
  }

  if (isComplete && onDismiss) {
    return null; // Don't show if complete and can be dismissed
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary-600 to-purple-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{t.title}</h3>
            <p className="text-primary-100 text-sm">{t.subtitle}</p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-primary-200 hover:text-white text-sm"
            >
              {t.dismiss}
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-primary-100 mb-1">
            <span>{progress}%</span>
            <span>
              {steps.filter((s) => s.is_completed).length}/{steps.length}
            </span>
          </div>
          <div className="h-2 bg-primary-400/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-100">
        {steps.map((step) => {
          const Icon = getIcon(step.icon);
          const isCompleted = step.is_completed;

          return (
            <div
              key={step.step_key}
              className={`p-4 flex items-center gap-4 ${
                isCompleted ? 'bg-gray-50' : ''
              }`}
            >
              {/* Icon/Check */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <Icons.Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}
                  >
                    {locale === 'tr' ? step.title_tr : step.title_en}
                  </span>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    +{step.xp_reward} {t.xp}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {locale === 'tr' ? step.description_tr : step.description_en}
                </p>
              </div>

              {/* Action */}
              {!isCompleted && step.action_url && (
                <Link
                  href={step.action_url}
                  className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors shrink-0"
                >
                  {locale === 'tr' ? step.action_label_tr : step.action_label_en}
                </Link>
              )}

              {isCompleted && (
                <span className="text-sm text-green-600 font-medium shrink-0">
                  {t.completed}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* All complete message */}
      {isComplete && (
        <div className="p-4 bg-green-50 text-center">
          <p className="text-green-700 font-medium">{t.allComplete}</p>
        </div>
      )}
    </div>
  );
}
