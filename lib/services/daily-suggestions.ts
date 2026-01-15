/**
 * Daily Content Suggestions Service
 * Generates personalized content suggestions based on pattern performance
 */

import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Platform } from '@/lib/types/platform';
import type { ToneType, FormatType, PersonaOverlay, CreatorPersonaProfile } from '@/lib/types/persona';
import { buildPersonaOverlay } from '@/lib/types/persona';
import type {
  DailySuggestion,
  SuggestionContent,
  PatternData,
  GenerateSuggestionsInput,
  GenerateSuggestionsResult,
} from '@/lib/types/daily-suggestions';
import { getEffectiveEntitlements } from '@/lib/services/plan-resolver';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const EXPLORATION_RATIO = 0.3; // 30% exploration

// Default platforms for suggestions
const DEFAULT_PLATFORMS: Platform[] = ['tiktok', 'instagram_reels'];

// CTA options by tone
const CTA_OPTIONS: Record<ToneType, string[]> = {
  funny: [
    'Takip et, daha fazla güleceksin!',
    'Like at, belki bir daha güldürürüm!',
    'Yorum yap, senin de komik fikirlerin var mı?',
  ],
  serious: [
    'Daha fazlası için takip et.',
    'Bu konuda ne düşünüyorsun?',
    'Kaydet, lazım olur.',
  ],
  educational: [
    'Kaydet, sonra tekrar bak!',
    'Arkadaşlarına gönder, onlar da öğrensin!',
    'Takip et, her gün yeni bilgi!',
  ],
  controversial: [
    'Katılıyor musun? Yorum yap!',
    'Tartışmaya katıl!',
    'Senin fikrin ne?',
  ],
  inspirational: [
    'Bugün harekete geç!',
    'Sen de yapabilirsin, takip et!',
    'Motivasyon için takipte kal!',
  ],
};

/**
 * Generate daily content suggestions for a user
 */
export async function generateDailySuggestions(
  supabase: SupabaseClient,
  input: GenerateSuggestionsInput
): Promise<GenerateSuggestionsResult> {
  const { userId, platforms = DEFAULT_PLATFORMS, count = 3, includeExploration = true } = input;

  // Get user's effective entitlements
  const entitlements = await getEffectiveEntitlements(supabase, userId);
  const hasPersonaLearning = entitlements?.features.persona_learning || false;

  // Fetch persona if available
  let personaOverlay: PersonaOverlay | null = null;
  if (hasPersonaLearning) {
    const { data: persona } = await supabase
      .from('creator_persona_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (persona) {
      personaOverlay = buildPersonaOverlay(persona as CreatorPersonaProfile, true);
    }
  }

  // Get top performing patterns
  const topPatterns = await getTopPerformingPatterns(supabase, userId, platforms);

  // Calculate exploration count
  const explorationCount = includeExploration ? Math.ceil(count * EXPLORATION_RATIO) : 0;
  const optimizedCount = count - explorationCount;

  const suggestions: DailySuggestion[] = [];
  const patternsUsed: string[] = [];

  // Generate optimized suggestions (70%)
  const optimizedPatterns = topPatterns.slice(0, optimizedCount);
  for (const pattern of optimizedPatterns) {
    const suggestion = await generateSuggestionFromPattern(
      supabase,
      userId,
      pattern,
      personaOverlay,
      false
    );
    if (suggestion) {
      suggestions.push(suggestion);
      patternsUsed.push(pattern.pattern_key);
    }
  }

  // Generate exploration suggestions (30%)
  if (explorationCount > 0) {
    const explorationPatterns = await selectExplorationPatterns(
      supabase,
      userId,
      platforms,
      explorationCount,
      patternsUsed
    );

    for (const pattern of explorationPatterns) {
      const suggestion = await generateSuggestionFromPattern(
        supabase,
        userId,
        pattern,
        personaOverlay,
        true
      );
      if (suggestion) {
        suggestions.push(suggestion);
        patternsUsed.push(pattern.pattern_key);
      }
    }
  }

  return {
    suggestions,
    patternsUsed,
    explorationCount,
  };
}

/**
 * Get top performing patterns for a user
 */
async function getTopPerformingPatterns(
  supabase: SupabaseClient,
  userId: string,
  platforms: Platform[]
): Promise<PatternData[]> {
  const { data: patterns, error } = await supabase
    .from('pattern_stats')
    .select('*')
    .eq('user_id', userId)
    .in('platform', platforms)
    .gte('total_results', 1) // Must have at least 1 result
    .order('weighted_score', { ascending: false })
    .limit(10);

  if (error || !patterns) {
    console.error('Error fetching patterns:', error);
    return [];
  }

  return patterns.map((p) => ({
    pattern_key: p.pattern_key,
    platform: p.platform as Platform,
    tone: p.tone as ToneType,
    format: undefined, // Pattern doesn't store format separately
    goal: p.goal,
    weighted_score: parseFloat(p.weighted_score) || 0,
    avg_engagement_rate: parseFloat(p.avg_engagement_rate) || 0,
    avg_views: parseFloat(p.avg_views) || 0,
    total_results: p.total_results,
    best_performing_preview: p.best_performing_preview,
  }));
}

/**
 * Select exploration patterns (new combinations not yet tried)
 */
async function selectExplorationPatterns(
  supabase: SupabaseClient,
  userId: string,
  platforms: Platform[],
  count: number,
  excludePatterns: string[]
): Promise<PatternData[]> {
  const tones: ToneType[] = ['funny', 'serious', 'educational', 'controversial', 'inspirational'];
  const formats: FormatType[] = ['listicle', 'story', 'tutorial', 'reaction', 'comparison'];

  const explorationPatterns: PatternData[] = [];

  // Generate random exploration patterns
  for (let i = 0; i < count * 2 && explorationPatterns.length < count; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    const format = formats[Math.floor(Math.random() * formats.length)];

    const patternKey = `${platform}:any:any:${tone}:any`;

    // Skip if already used
    if (excludePatterns.includes(patternKey)) continue;

    // Check if pattern already exists in user's history
    const { data: existing } = await supabase
      .from('pattern_stats')
      .select('pattern_key')
      .eq('user_id', userId)
      .eq('pattern_key', patternKey)
      .single();

    // Add if it's truly new or has low data
    if (!existing) {
      explorationPatterns.push({
        pattern_key: patternKey,
        platform,
        tone,
        format,
        goal: undefined,
        weighted_score: 0,
        avg_engagement_rate: 0,
        avg_views: 0,
        total_results: 0,
        best_performing_preview: undefined,
      });
      excludePatterns.push(patternKey);
    }
  }

  return explorationPatterns;
}

/**
 * Generate a single suggestion from a pattern
 */
async function generateSuggestionFromPattern(
  supabase: SupabaseClient,
  userId: string,
  pattern: PatternData,
  personaOverlay: PersonaOverlay | null,
  isExploration: boolean
): Promise<DailySuggestion | null> {
  try {
    // Generate hook idea using AI
    const hookIdea = await generateHookIdea(pattern, personaOverlay);
    if (!hookIdea) return null;

    // Select appropriate CTA
    const ctaOptions = CTA_OPTIONS[pattern.tone] || CTA_OPTIONS.educational;
    const cta = ctaOptions[Math.floor(Math.random() * ctaOptions.length)];

    // Build reason
    const reason = isExploration
      ? `Yeni bir ${pattern.tone} tarzı deniyoruz!`
      : `${pattern.tone} tonun ${pattern.avg_engagement_rate.toFixed(1)}% etkileşim oranı ile en iyi performansı gösteriyor.`;

    // Build suggestion content
    const suggestionContent: SuggestionContent = {
      hook_idea: hookIdea,
      format: pattern.format || 'listicle',
      tone: pattern.tone,
      cta,
      reason,
      pattern_key: pattern.pattern_key,
      is_exploration: isExploration,
      avg_engagement: pattern.avg_engagement_rate,
      confidence_score: isExploration ? 50 : Math.min(100, pattern.weighted_score * 10),
    };

    // Insert into database
    const today = new Date().toISOString().split('T')[0];

    const { data: suggestion, error } = await supabase
      .from('daily_suggestions')
      .upsert(
        {
          user_id: userId,
          suggestion_date: today,
          platform: pattern.platform,
          suggestion_json: suggestionContent,
          used: false,
        },
        {
          onConflict: 'user_id,suggestion_date,platform',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error inserting suggestion:', error);
      return null;
    }

    return {
      id: suggestion.id,
      user_id: suggestion.user_id,
      suggestion_date: suggestion.suggestion_date,
      platform: suggestion.platform as Platform,
      suggestion_json: suggestionContent,
      used: suggestion.used,
      used_at: suggestion.used_at,
      generation_id: suggestion.generation_id,
      created_at: suggestion.created_at,
    };
  } catch (error) {
    console.error('Error generating suggestion:', error);
    return null;
  }
}

/**
 * Generate a hook idea using AI
 */
async function generateHookIdea(
  pattern: PatternData,
  personaOverlay: PersonaOverlay | null
): Promise<string | null> {
  const toneDescriptions: Record<ToneType, string> = {
    funny: 'komik, eğlenceli ve dikkat çekici',
    serious: 'ciddi, profesyonel ve bilgilendirici',
    educational: 'eğitici, bilgi dolu ve faydalı',
    controversial: 'tartışmalı, provokatif ve dikkat çekici',
    inspirational: 'ilham verici, motive edici ve pozitif',
  };

  const formatDescriptions: Record<FormatType, string> = {
    listicle: 'liste formatında (örn: "5 Şey...", "3 Sır...")',
    story: 'hikaye anlatımı formatında',
    tutorial: 'eğitim/nasıl yapılır formatında',
    reaction: 'tepki/yorum formatında',
    comparison: 'karşılaştırma formatında',
  };

  const platformTips: Record<Platform, string> = {
    tiktok: 'TikTok için kısa, dikkat çekici ve trend odaklı',
    instagram_reels: 'Instagram Reels için görsel ve estetik odaklı',
    instagram_post: 'Instagram Post için detaylı ve bilgilendirici',
    youtube_shorts: 'YouTube Shorts için hızlı ve eğlenceli',
  };

  const personaHint = personaOverlay?.enabled
    ? `Bu içerik üreticisi ${toneDescriptions[personaOverlay.tone_preference]} bir tarza sahip. Hook uzunluğu yaklaşık ${personaOverlay.target_hook_length} kelime olmalı.`
    : '';

  const systemPrompt = `Sen bir viral içerik stratejisti olarak çalışıyorsun. Görevin ${pattern.platform} için hook fikirleri üretmek.

${personaHint}

Hook kuralları:
- ${toneDescriptions[pattern.tone]} olmalı
- ${pattern.format ? formatDescriptions[pattern.format] : 'Herhangi bir format'} kullan
- ${platformTips[pattern.platform]}
- Türkçe ve doğal olmalı
- 5-15 kelime arası olmalı
- Dikkat çekici ve merak uyandırıcı olmalı

Sadece 1 hook fikri yaz. Açıklama yapma, sadece hook metnini yaz.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 100,
      temperature: 0.8,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${pattern.tone} tonunda bir ${pattern.platform} hook fikri üret.${
            pattern.best_performing_preview
              ? ` Referans içerik: "${pattern.best_performing_preview}"`
              : ''
          }`,
        },
      ],
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Error generating hook idea:', error);
    return null;
  }
}

/**
 * Get today's suggestions for a user
 */
export async function getTodaySuggestions(
  supabase: SupabaseClient,
  userId: string
): Promise<DailySuggestion[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data: suggestions, error } = await supabase
    .from('daily_suggestions')
    .select('*')
    .eq('user_id', userId)
    .eq('suggestion_date', today)
    .order('created_at', { ascending: false });

  if (error || !suggestions) {
    console.error('Error fetching suggestions:', error);
    return [];
  }

  return suggestions.map((s) => ({
    id: s.id,
    user_id: s.user_id,
    suggestion_date: s.suggestion_date,
    platform: s.platform as Platform,
    suggestion_json: s.suggestion_json as SuggestionContent,
    used: s.used,
    used_at: s.used_at,
    generation_id: s.generation_id,
    created_at: s.created_at,
  }));
}

/**
 * Mark a suggestion as used
 */
export async function markSuggestionUsed(
  supabase: SupabaseClient,
  suggestionId: string,
  generationId?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('daily_suggestions')
    .update({
      used: true,
      used_at: new Date().toISOString(),
      generation_id: generationId,
    })
    .eq('id', suggestionId);

  if (error) {
    console.error('Error marking suggestion as used:', error);
    return false;
  }

  return true;
}

/**
 * Check if user can generate suggestions today
 */
export async function canGenerateSuggestions(
  supabase: SupabaseClient,
  userId: string
): Promise<{ can: boolean; reason?: string; existingCount: number }> {
  const today = new Date().toISOString().split('T')[0];

  // Check existing suggestions for today
  const { count, error } = await supabase
    .from('daily_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('suggestion_date', today);

  if (error) {
    console.error('Error checking suggestions:', error);
    return { can: false, reason: 'Database error', existingCount: 0 };
  }

  const existingCount = count || 0;

  // Get entitlements to check limit
  const entitlements = await getEffectiveEntitlements(supabase, userId);
  const limit = entitlements?.limits.daily_suggestions || 1;

  if (existingCount >= limit) {
    return {
      can: false,
      reason: `Bugün için öneri limitine ulaştınız (${limit})`,
      existingCount,
    };
  }

  return { can: true, existingCount };
}

/**
 * Get suggestion statistics for a user
 */
export async function getSuggestionStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  totalSuggestions: number;
  usedSuggestions: number;
  usageRate: number;
  topPatterns: string[];
}> {
  // Get total and used counts
  const { data: suggestions } = await supabase
    .from('daily_suggestions')
    .select('id, used, suggestion_json')
    .eq('user_id', userId);

  if (!suggestions) {
    return {
      totalSuggestions: 0,
      usedSuggestions: 0,
      usageRate: 0,
      topPatterns: [],
    };
  }

  const totalSuggestions = suggestions.length;
  const usedSuggestions = suggestions.filter((s) => s.used).length;
  const usageRate = totalSuggestions > 0 ? (usedSuggestions / totalSuggestions) * 100 : 0;

  // Count pattern usage
  const patternCounts = new Map<string, number>();
  for (const s of suggestions.filter((s) => s.used)) {
    const pattern = (s.suggestion_json as SuggestionContent)?.pattern_key;
    if (pattern) {
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
    }
  }

  const topPatterns = [...patternCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pattern]) => pattern);

  return {
    totalSuggestions,
    usedSuggestions,
    usageRate,
    topPatterns,
  };
}
