/**
 * Publishing & Distribution Service
 * Handles caption generation, hashtags, and post scheduling
 */

import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Platform } from '@/lib/types/platform';
import type { PersonaOverlay, CreatorPersonaProfile } from '@/lib/types/persona';
import { buildPersonaOverlay } from '@/lib/types/persona';
import type {
  PlannedPost,
  CreatePlannedPostInput,
  UpdatePlannedPostInput,
  CaptionResult,
  GenerateCaptionInput,
  GenerateHashtagsInput,
  PublishingStats,
  PlannedPostStatus,
} from '@/lib/types/publishing';
import { getEffectiveEntitlements, incrementUsageAndCheck, canUseFeature } from '@/lib/services/plan-resolver';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Platform-specific hashtag counts
const HASHTAG_COUNTS: Record<Platform, number> = {
  tiktok: 5,
  instagram_reels: 20,
  instagram_post: 25,
  youtube_shorts: 5,
};

// Platform-specific caption lengths
const CAPTION_LENGTHS: Record<Platform, { min: number; max: number }> = {
  tiktok: { min: 50, max: 150 },
  instagram_reels: { min: 100, max: 300 },
  instagram_post: { min: 150, max: 500 },
  youtube_shorts: { min: 50, max: 100 },
};

/**
 * Generate a caption for a hook
 */
export async function generateCaption(
  supabase: SupabaseClient,
  userId: string,
  input: GenerateCaptionInput
): Promise<CaptionResult | null> {
  const { hook, platform, locale, tone, niche, includeStoryVersion, includeThreadVersion } = input;

  // Check usage limits
  const usageCheck = await canUseFeature(supabase, userId, 'caption_generations');
  if (usageCheck.status === 'blocked') {
    console.log('Caption generation limit reached');
    return null;
  }

  // Get persona overlay if available
  const entitlements = await getEffectiveEntitlements(supabase, userId);
  let personaOverlay: PersonaOverlay | null = null;

  if (entitlements?.features.persona_learning) {
    const { data: persona } = await supabase
      .from('creator_persona_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (persona) {
      personaOverlay = buildPersonaOverlay(persona as CreatorPersonaProfile, true);
    }
  }

  // Platform-specific instructions
  const platformInstructions: Record<Platform, string> = {
    tiktok: `TikTok için kısa ve dikkat çekici yaz. Hashtagleri minimumda tut (${HASHTAG_COUNTS.tiktok} max). Trend sesleri ve challenge'lardan bahsedebilirsin.`,
    instagram_reels: `Instagram Reels için görsel ve estetik odaklı yaz. Hashtagler önemli (${HASHTAG_COUNTS.instagram_reels} adet). CTA ekle.`,
    instagram_post: `Instagram Post için detaylı ve bilgilendirici yaz. Carousel için alt metinler öner. Hashtagler çok önemli (${HASHTAG_COUNTS.instagram_post} adet).`,
    youtube_shorts: `YouTube Shorts için kısa ve merak uyandırıcı yaz. Hashtagleri minimumda tut (${HASHTAG_COUNTS.youtube_shorts} max).`,
  };

  const captionLength = CAPTION_LENGTHS[platform];
  const hashtagCount = HASHTAG_COUNTS[platform];

  const personaHint = personaOverlay?.enabled
    ? `İçerik üreticinin tarzı: ${personaOverlay.tone_preference}, CTA stili: ${personaOverlay.cta_style}`
    : '';

  const systemPrompt = `Sen bir viral içerik stratejistisin. ${platformInstructions[platform]}

${personaHint}

Kurallar:
- Caption ${captionLength.min}-${captionLength.max} karakter arası olmalı
- ${hashtagCount} adet ilgili hashtag ekle
- ${locale === 'tr' ? 'Türkçe' : 'İngilizce'} yaz
- Hook'un mesajını genişlet, tekrarlama
- Emoji kullan ama abartma
${tone ? `- Ton: ${tone}` : ''}
${niche ? `- Niş: ${niche}` : ''}

JSON formatında yanıt ver:
{
  "caption": "...",
  "hashtags": ["...", "..."]${includeStoryVersion ? ',\n  "story_version": "..."' : ''}${includeThreadVersion ? ',\n  "thread_version": ["...", "...", "..."]' : ''}
}`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Hook: "${hook}"` },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    // Parse JSON response
    const result = JSON.parse(content) as CaptionResult;

    // Increment usage
    await incrementUsageAndCheck(supabase, userId, 'caption_generations', 1);

    return result;
  } catch (error) {
    console.error('Error generating caption:', error);
    return null;
  }
}

/**
 * Generate hashtags for a niche/platform
 */
export async function generateHashtags(
  input: GenerateHashtagsInput
): Promise<string[]> {
  const { platform, niche, locale, count = 10 } = input;

  const systemPrompt = `Sen bir sosyal medya hashtag uzmanısın. ${platform} için ${niche} nişine uygun hashtagler üret.

Kurallar:
- Tam olarak ${count} hashtag üret
- ${locale === 'tr' ? 'Türkçe' : 'İngilizce'} hashtagler
- Popüler ve niş hashtagleri karıştır
- # işareti olmadan yaz
- Her satıra bir hashtag

Sadece hashtag listesini yaz, başka bir şey yazma.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 200,
      temperature: 0.8,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${niche} nişi için ${platform} hashtagleri` },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return [];

    return content
      .split('\n')
      .map((h) => h.trim().replace(/^#/, ''))
      .filter((h) => h.length > 0)
      .slice(0, count);
  } catch (error) {
    console.error('Error generating hashtags:', error);
    return [];
  }
}

/**
 * Create a planned post
 */
export async function createPlannedPost(
  supabase: SupabaseClient,
  userId: string,
  input: CreatePlannedPostInput
): Promise<PlannedPost | null> {
  const { data: post, error } = await supabase
    .from('planned_posts')
    .insert({
      user_id: userId,
      platform: input.platform,
      hook: input.hook,
      caption: input.caption,
      hashtags: input.hashtags,
      scheduled_at: input.scheduled_at,
      source_suggestion_id: input.source_suggestion_id,
      source_generation_id: input.source_generation_id,
      notes: input.notes,
      status: 'planned',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating planned post:', error);
    return null;
  }

  return {
    id: post.id,
    user_id: post.user_id,
    platform: post.platform as Platform,
    hook: post.hook,
    caption: post.caption,
    hashtags: post.hashtags,
    scheduled_at: post.scheduled_at,
    status: post.status as PlannedPostStatus,
    source_suggestion_id: post.source_suggestion_id,
    source_generation_id: post.source_generation_id,
    reminder_sent: post.reminder_sent,
    reminder_sent_at: post.reminder_sent_at,
    result_id: post.result_id,
    notes: post.notes,
    created_at: post.created_at,
    updated_at: post.updated_at,
  };
}

/**
 * Update a planned post
 */
export async function updatePlannedPost(
  supabase: SupabaseClient,
  userId: string,
  input: UpdatePlannedPostInput
): Promise<PlannedPost | null> {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.hook !== undefined) updateData.hook = input.hook;
  if (input.caption !== undefined) updateData.caption = input.caption;
  if (input.hashtags !== undefined) updateData.hashtags = input.hashtags;
  if (input.scheduled_at !== undefined) updateData.scheduled_at = input.scheduled_at;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const { data: post, error } = await supabase
    .from('planned_posts')
    .update(updateData)
    .eq('id', input.id)
    .eq('user_id', userId) // Security: ensure user owns the post
    .select()
    .single();

  if (error) {
    console.error('Error updating planned post:', error);
    return null;
  }

  return {
    id: post.id,
    user_id: post.user_id,
    platform: post.platform as Platform,
    hook: post.hook,
    caption: post.caption,
    hashtags: post.hashtags,
    scheduled_at: post.scheduled_at,
    status: post.status as PlannedPostStatus,
    source_suggestion_id: post.source_suggestion_id,
    source_generation_id: post.source_generation_id,
    reminder_sent: post.reminder_sent,
    reminder_sent_at: post.reminder_sent_at,
    result_id: post.result_id,
    notes: post.notes,
    created_at: post.created_at,
    updated_at: post.updated_at,
  };
}

/**
 * Delete a planned post
 */
export async function deletePlannedPost(
  supabase: SupabaseClient,
  userId: string,
  postId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('planned_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting planned post:', error);
    return false;
  }

  return true;
}

/**
 * Get upcoming posts for a user
 */
export async function getUpcomingPosts(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 10
): Promise<PlannedPost[]> {
  const { data: posts, error } = await supabase
    .from('planned_posts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'planned')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error || !posts) {
    console.error('Error fetching upcoming posts:', error);
    return [];
  }

  return posts.map((p) => ({
    id: p.id,
    user_id: p.user_id,
    platform: p.platform as Platform,
    hook: p.hook,
    caption: p.caption,
    hashtags: p.hashtags,
    scheduled_at: p.scheduled_at,
    status: p.status as PlannedPostStatus,
    source_suggestion_id: p.source_suggestion_id,
    source_generation_id: p.source_generation_id,
    reminder_sent: p.reminder_sent,
    reminder_sent_at: p.reminder_sent_at,
    result_id: p.result_id,
    notes: p.notes,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));
}

/**
 * Get all posts for a user with optional filters
 */
export async function getUserPosts(
  supabase: SupabaseClient,
  userId: string,
  options: {
    status?: PlannedPostStatus;
    platform?: Platform;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ posts: PlannedPost[]; total: number }> {
  const { status, platform, limit = 20, offset = 0 } = options;

  let query = supabase
    .from('planned_posts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (status) query = query.eq('status', status);
  if (platform) query = query.eq('platform', platform);

  query = query
    .order('scheduled_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: posts, count, error } = await query;

  if (error || !posts) {
    console.error('Error fetching user posts:', error);
    return { posts: [], total: 0 };
  }

  return {
    posts: posts.map((p) => ({
      id: p.id,
      user_id: p.user_id,
      platform: p.platform as Platform,
      hook: p.hook,
      caption: p.caption,
      hashtags: p.hashtags,
      scheduled_at: p.scheduled_at,
      status: p.status as PlannedPostStatus,
      source_suggestion_id: p.source_suggestion_id,
      source_generation_id: p.source_generation_id,
      reminder_sent: p.reminder_sent,
      reminder_sent_at: p.reminder_sent_at,
      result_id: p.result_id,
      notes: p.notes,
      created_at: p.created_at,
      updated_at: p.updated_at,
    })),
    total: count || 0,
  };
}

/**
 * Link a post to its content result
 */
export async function linkPostToResult(
  supabase: SupabaseClient,
  postId: string,
  resultId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('planned_posts')
    .update({
      result_id: resultId,
      status: 'published',
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId);

  if (error) {
    console.error('Error linking post to result:', error);
    return false;
  }

  return true;
}

/**
 * Get publishing statistics for a user
 */
export async function getPublishingStats(
  supabase: SupabaseClient,
  userId: string
): Promise<PublishingStats> {
  // Get counts by status
  const { data: statusCounts } = await supabase
    .from('planned_posts')
    .select('status')
    .eq('user_id', userId);

  const counts = {
    planned: 0,
    published: 0,
    skipped: 0,
  };

  for (const p of statusCounts || []) {
    if (p.status in counts) {
      counts[p.status as keyof typeof counts]++;
    }
  }

  // Get upcoming posts count
  const { count: upcomingCount } = await supabase
    .from('planned_posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'planned')
    .gte('scheduled_at', new Date().toISOString());

  // Get next scheduled post
  const { data: nextPost } = await supabase
    .from('planned_posts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'planned')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .single();

  return {
    total_planned: counts.planned,
    total_published: counts.published,
    total_skipped: counts.skipped,
    upcoming_count: upcomingCount || 0,
    next_scheduled: nextPost
      ? {
          id: nextPost.id,
          user_id: nextPost.user_id,
          platform: nextPost.platform as Platform,
          hook: nextPost.hook,
          caption: nextPost.caption,
          hashtags: nextPost.hashtags,
          scheduled_at: nextPost.scheduled_at,
          status: nextPost.status as PlannedPostStatus,
          source_suggestion_id: nextPost.source_suggestion_id,
          source_generation_id: nextPost.source_generation_id,
          reminder_sent: nextPost.reminder_sent,
          reminder_sent_at: nextPost.reminder_sent_at,
          result_id: nextPost.result_id,
          notes: nextPost.notes,
          created_at: nextPost.created_at,
          updated_at: nextPost.updated_at,
        }
      : undefined,
  };
}

/**
 * Get posts that need reminders (scheduled within next 2 hours)
 */
export async function getPostsNeedingReminders(
  supabase: SupabaseClient
): Promise<PlannedPost[]> {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const { data: posts, error } = await supabase
    .from('planned_posts')
    .select('*')
    .eq('status', 'planned')
    .eq('reminder_sent', false)
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', twoHoursLater.toISOString());

  if (error || !posts) {
    console.error('Error fetching posts for reminders:', error);
    return [];
  }

  return posts.map((p) => ({
    id: p.id,
    user_id: p.user_id,
    platform: p.platform as Platform,
    hook: p.hook,
    caption: p.caption,
    hashtags: p.hashtags,
    scheduled_at: p.scheduled_at,
    status: p.status as PlannedPostStatus,
    source_suggestion_id: p.source_suggestion_id,
    source_generation_id: p.source_generation_id,
    reminder_sent: p.reminder_sent,
    reminder_sent_at: p.reminder_sent_at,
    result_id: p.result_id,
    notes: p.notes,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));
}

/**
 * Mark reminder as sent for a post
 */
export async function markReminderSent(
  supabase: SupabaseClient,
  postId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('planned_posts')
    .update({
      reminder_sent: true,
      reminder_sent_at: new Date().toISOString(),
    })
    .eq('id', postId);

  if (error) {
    console.error('Error marking reminder as sent:', error);
    return false;
  }

  return true;
}
