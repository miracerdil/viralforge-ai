'use client';

import { Flame, Trophy, Star, Zap } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { UserStreak } from '@/lib/types/missions';

interface StreakDisplayProps {
  streak: UserStreak;
  dictionary: Dictionary;
}

const MILESTONES = [3, 7, 14, 30];

export function StreakDisplay({ streak, dictionary }: StreakDisplayProps) {
  const t = dictionary.missions.streak;

  const currentStreak = streak.current_streak;
  const nextMilestone = MILESTONES.find((m) => m > currentStreak) || MILESTONES[MILESTONES.length - 1];
  const prevMilestone = MILESTONES.filter((m) => m <= currentStreak).pop() || 0;
  const progress = prevMilestone === nextMilestone
    ? 100
    : ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

  const getMilestoneIcon = (days: number) => {
    if (days <= 3) return <Star className="w-3 h-3" />;
    if (days <= 7) return <Zap className="w-3 h-3" />;
    if (days <= 14) return <Flame className="w-3 h-3" />;
    return <Trophy className="w-3 h-3" />;
  };

  const getMilestoneColor = (days: number, achieved: boolean) => {
    if (!achieved) return 'bg-gray-100 text-gray-400 border-gray-200';
    if (days <= 3) return 'bg-amber-100 text-amber-600 border-amber-300';
    if (days <= 7) return 'bg-blue-100 text-blue-600 border-blue-300';
    if (days <= 14) return 'bg-purple-100 text-purple-600 border-purple-300';
    return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-orange-400';
  };

  return (
    <div className="space-y-3">
      {/* Stats Row */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-gray-900">{currentStreak}</span>
            <span className="text-gray-500">{t.days}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{t.best}: {streak.longest_streak}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <Zap className="w-4 h-4 text-purple-500" />
          <span>{streak.total_xp} XP</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{t.nextMilestone}: {nextMilestone} {t.days}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="flex items-center justify-between gap-1">
        {MILESTONES.map((days) => {
          const achieved = currentStreak >= days;
          return (
            <div
              key={days}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border text-xs font-medium ${getMilestoneColor(days, achieved)}`}
            >
              {getMilestoneIcon(days)}
              <span>{days}</span>
            </div>
          );
        })}
      </div>

      {/* Motivation Message */}
      {currentStreak > 0 && (
        <p className="text-xs text-center text-gray-500">
          {currentStreak >= 30
            ? t.legendStatus
            : currentStreak >= 14
            ? t.onFire
            : currentStreak >= 7
            ? t.keepGoing
            : currentStreak >= 3
            ? t.goodStart
            : t.buildStreak}
        </p>
      )}
    </div>
  );
}
