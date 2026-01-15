export type MissionDifficulty = 'easy' | 'medium' | 'hard';

export type MissionNiche =
  | 'lifestyle'
  | 'comedy'
  | 'education'
  | 'food'
  | 'fitness'
  | 'tech'
  | 'beauty'
  | 'travel'
  | 'general';

export interface DailyMission {
  id: string;
  locale: string;
  niche: MissionNiche;
  mission_text: string;
  difficulty: MissionDifficulty;
  xp_reward: number;
  is_pro_only: boolean;
  created_at: string;
}

export interface UserMissionProgress {
  id: string;
  user_id: string;
  mission_id: string;
  date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  mission?: DailyMission;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_missions_completed: number;
  total_xp: number;
  last_completed_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedCard {
  id: string;
  user_id: string;
  card_type: 'analysis' | 'planner';
  reference_id: string;
  share_token: string;
  view_count: number;
  created_at: string;
}

export interface TodayMissionResponse {
  mission: DailyMission | null;
  progress: UserMissionProgress | null;
  streak: UserStreak | null;
}

export interface StreakMilestone {
  days: number;
  reward: string;
  achieved: boolean;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, reward: 'Bronze Badge', achieved: false },
  { days: 7, reward: 'Silver Badge', achieved: false },
  { days: 14, reward: 'Gold Badge', achieved: false },
  { days: 30, reward: 'Platinum Badge', achieved: false },
];

export const DIFFICULTY_XP: Record<MissionDifficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
};

export const DIFFICULTY_COLORS: Record<MissionDifficulty, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};
