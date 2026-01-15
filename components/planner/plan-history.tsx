'use client';

import { useState, useEffect } from 'react';
import { History, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils/date';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { WeeklyPlan } from '@/lib/types/planner';

interface PlanHistoryProps {
  locale: string;
  dictionary: Dictionary;
  onSelectPlan: (plan: WeeklyPlan) => void;
}

interface PlanWithRequest extends WeeklyPlan {
  planner_requests: {
    niche: string;
    goal: string;
    audience: string | null;
    tone: string | null;
    frequency: number;
  };
}

export function PlanHistory({ locale, dictionary, onSelectPlan }: PlanHistoryProps) {
  const t = dictionary.planner;
  const [plans, setPlans] = useState<PlanWithRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/planner/history?limit=10');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Spinner size="md" />
        </CardContent>
      </Card>
    );
  }

  if (plans.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5 text-gray-600" />
          {t.history}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => onSelectPlan(plan)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {nicheLabels[plan.planner_requests.niche]?.[locale as 'tr' | 'en'] ||
                    plan.planner_requests.niche}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {plan.planner_requests.frequency} {t.videos}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(new Date(plan.created_at), locale)}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
