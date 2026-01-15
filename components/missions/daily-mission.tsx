'use client';

import { useState, useEffect } from 'react';
import { Target, Check, Flame, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { StreakDisplay } from './streak-display';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { DailyMission, UserMissionProgress, UserStreak } from '@/lib/types/missions';
import { DIFFICULTY_COLORS } from '@/lib/types/missions';

interface DailyMissionProps {
  locale: string;
  dictionary: Dictionary;
  isPro: boolean;
  niche?: string;
}

export function DailyMissionCard({ locale, dictionary, isPro, niche = 'general' }: DailyMissionProps) {
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [mission, setMission] = useState<DailyMission | null>(null);
  const [progress, setProgress] = useState<UserMissionProgress | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const t = dictionary.missions;

  const fetchMission = async () => {
    try {
      const response = await fetch(`/api/missions?locale=${locale}&niche=${niche}`);
      if (response.ok) {
        const data = await response.json();
        setMission(data.mission);
        setProgress(data.progress);
        setStreak(data.streak);
      }
    } catch (error) {
      console.error('Fetch mission error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMission();
  }, [locale, niche]);

  const handleComplete = async () => {
    if (!mission) return;

    if (mission.is_pro_only && !isPro) {
      setShowUpgradeModal(true);
      return;
    }

    setCompleting(true);
    try {
      const response = await fetch('/api/missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission_id: mission.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
        setStreak(data.streak);
      }
    } catch (error) {
      console.error('Complete mission error:', error);
    } finally {
      setCompleting(false);
    }
  };

  const isCompleted = progress?.completed;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (!mission) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t.noMission}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={isCompleted ? 'border-green-200 bg-green-50/50' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isCompleted ? 'bg-green-100' : 'bg-primary-100'
              }`}>
                {isCompleted ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Target className="w-5 h-5 text-primary-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t.title}</h3>
                <p className="text-xs text-gray-500">{t.dailyChallenge}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={DIFFICULTY_COLORS[mission.difficulty]}>
                {t.difficulty[mission.difficulty]}
              </Badge>
              {mission.is_pro_only && (
                <Badge className="bg-amber-100 text-amber-700">
                  <Crown className="w-3 h-3 mr-1" />
                  PRO
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Mission Text */}
            <div className={`p-4 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-gray-50'}`}>
              <p className={`text-sm ${isCompleted ? 'text-green-800' : 'text-gray-700'}`}>
                {mission.mission_text}
              </p>
            </div>

            {/* XP Reward */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t.reward}: +{mission.xp_reward} XP</span>
              </div>
              {streak && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Flame className="w-4 h-4" />
                  <span>{streak.current_streak} {t.dayStreak}</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            {isCompleted ? (
              <div className="flex items-center justify-center gap-2 py-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">{t.completed}</span>
              </div>
            ) : (
              <Button
                onClick={handleComplete}
                isLoading={completing}
                className="w-full"
              >
                {mission.is_pro_only && !isPro ? (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    {t.unlockWithPro}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {t.markComplete}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Streak Display */}
          {streak && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <StreakDisplay streak={streak} dictionary={dictionary} />
            </div>
          )}
        </CardContent>
      </Card>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        dictionary={dictionary}
        locale={locale}
        feature="missions"
      />
    </>
  );
}
