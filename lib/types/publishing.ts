/**
 * Publishing & Distribution Types
 * Types for the content publishing and distribution workflow
 */

import type { Platform } from './platform';

// Planned post status
export type PlannedPostStatus = 'planned' | 'published' | 'skipped';

// Full planned post record
export interface PlannedPost {
  id: string;
  user_id: string;
  platform: Platform;
  hook: string;
  caption?: string;
  hashtags?: string[];
  scheduled_at: string;
  status: PlannedPostStatus;
  source_suggestion_id?: string;
  source_generation_id?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  result_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Input for creating a planned post
export interface CreatePlannedPostInput {
  platform: Platform;
  hook: string;
  caption?: string;
  hashtags?: string[];
  scheduled_at: string;
  source_suggestion_id?: string;
  source_generation_id?: string;
  notes?: string;
}

// Input for updating a planned post
export interface UpdatePlannedPostInput {
  id: string;
  hook?: string;
  caption?: string;
  hashtags?: string[];
  scheduled_at?: string;
  status?: PlannedPostStatus;
  notes?: string;
}

// Caption generation result
export interface CaptionResult {
  caption: string;
  hashtags: string[];
  story_version?: string;
  thread_version?: string[];
}

// Caption generation input
export interface GenerateCaptionInput {
  hook: string;
  platform: Platform;
  locale: 'tr' | 'en';
  tone?: string;
  niche?: string;
  includeStoryVersion?: boolean;
  includeThreadVersion?: boolean;
}

// Hashtag generation input
export interface GenerateHashtagsInput {
  platform: Platform;
  niche: string;
  locale: 'tr' | 'en';
  count?: number; // default 10
}

// API response for planned posts
export interface PlannedPostsResponse {
  posts: PlannedPost[];
  hasMore: boolean;
  total: number;
}

// API response for caption generation
export interface CaptionGenerationResponse {
  success: boolean;
  result: CaptionResult;
  tokensUsed?: number;
}

// Scheduled post reminder
export interface PostReminder {
  post_id: string;
  user_id: string;
  platform: Platform;
  hook: string;
  scheduled_at: string;
  hours_until: number;
}

// Publishing stats for dashboard
export interface PublishingStats {
  total_planned: number;
  total_published: number;
  total_skipped: number;
  upcoming_count: number;
  next_scheduled?: PlannedPost;
}

// Display format for UI
export interface PlannedPostDisplay {
  id: string;
  platform: Platform;
  platformLabel: string;
  hook: string;
  caption?: string;
  hashtags?: string[];
  scheduledAt: Date;
  scheduledLabel: string;
  status: PlannedPostStatus;
  statusLabel: string;
  isOverdue: boolean;
  hasResult: boolean;
}

// Helper: Convert DB post to display format
export function toPlannedPostDisplay(
  post: PlannedPost,
  locale: 'tr' | 'en'
): PlannedPostDisplay {
  const platformLabels: Record<Platform, string> = {
    tiktok: 'TikTok',
    instagram_reels: 'Instagram Reels',
    instagram_post: 'Instagram Post',
    youtube_shorts: 'YouTube Shorts',
  };

  const statusLabels: Record<PlannedPostStatus, { tr: string; en: string }> = {
    planned: { tr: 'Planlandı', en: 'Planned' },
    published: { tr: 'Yayınlandı', en: 'Published' },
    skipped: { tr: 'Atlandı', en: 'Skipped' },
  };

  const scheduledAt = new Date(post.scheduled_at);
  const now = new Date();
  const isOverdue = post.status === 'planned' && scheduledAt < now;

  // Format scheduled time
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  const scheduledLabel = scheduledAt.toLocaleDateString(
    locale === 'tr' ? 'tr-TR' : 'en-US',
    options
  );

  return {
    id: post.id,
    platform: post.platform,
    platformLabel: platformLabels[post.platform] || post.platform,
    hook: post.hook,
    caption: post.caption,
    hashtags: post.hashtags,
    scheduledAt,
    scheduledLabel,
    status: post.status,
    statusLabel: statusLabels[post.status]?.[locale] || post.status,
    isOverdue,
    hasResult: !!post.result_id,
  };
}

// Helper: Get time until scheduled
export function getTimeUntil(
  scheduledAt: string,
  locale: 'tr' | 'en'
): string {
  const scheduled = new Date(scheduledAt);
  const now = new Date();
  const diffMs = scheduled.getTime() - now.getTime();

  if (diffMs < 0) {
    return locale === 'tr' ? 'Geçti' : 'Overdue';
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return locale === 'tr' ? `${diffDays} gün` : `${diffDays} days`;
  }

  if (diffHours > 0) {
    return locale === 'tr' ? `${diffHours} saat` : `${diffHours} hours`;
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return locale === 'tr' ? `${diffMinutes} dakika` : `${diffMinutes} minutes`;
}

// Helper: Group posts by date
export function groupPostsByDate(
  posts: PlannedPost[],
  locale: 'tr' | 'en'
): Map<string, PlannedPost[]> {
  const groups = new Map<string, PlannedPost[]>();

  for (const post of posts) {
    const date = new Date(post.scheduled_at);
    const dateKey = date.toLocaleDateString(
      locale === 'tr' ? 'tr-TR' : 'en-US',
      { weekday: 'long', month: 'long', day: 'numeric' }
    );

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(post);
  }

  return groups;
}
