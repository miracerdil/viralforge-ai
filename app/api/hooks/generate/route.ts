import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasProAccess } from '@/lib/admin';
import type { GenerateHooksRequest, HookTemplate } from '@/lib/types/hooks';
import { GENERATE_HOOKS_COUNT } from '@/lib/types/hooks';
import type { Platform } from '@/lib/types/platform';
import type { CategoryGroupId } from '@/lib/types/category';
import { buildHooksPrompt } from '@/lib/ai/prompts';
import { buildPersonaOverlay } from '@/lib/types/persona';
import type { CreatorPersonaProfile, PersonaOverlay } from '@/lib/types/persona';
import type { PerformanceBias } from '@/lib/types/performance';
import { trackGeneration, getPerformanceBias } from '@/lib/services/performance-tracking';
import {
  canUseFeature,
  incrementUsageAndCheck,
  getEffectiveEntitlements,
} from '@/lib/services/plan-resolver';
import { logActivityWithLocale } from '@/lib/services/activity-logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check plan and premium hooks access
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, comped_until, premium_hooks_until')
      .eq('id', user.id)
      .single();

    const isPro = profile ? hasProAccess(profile.plan, profile.comped_until) : false;

    // Check for premium hooks from reward shop (24h pass)
    const hasPremiumHooks = profile?.premium_hooks_until
      ? new Date(profile.premium_hooks_until) > new Date()
      : false;

    // Check usage limits (applies to all users including Pro)
    const usageCheck = await canUseFeature(supabase, user.id, 'monthly_hooks');

    if (usageCheck.status === 'blocked' && !hasPremiumHooks) {
      return NextResponse.json(
        {
          error: 'limit_reached',
          message: 'You have reached your monthly hook generation limit.',
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
          used: usageCheck.used,
        },
        { status: 429 }
      );
    }

    // Get effective entitlements for feature flags
    const entitlements = await getEffectiveEntitlements(supabase, user.id);

    const body: GenerateHooksRequest = await request.json();
    const { platform = 'tiktok', niche, tone, goal, locale, categoryGroup = 'creator', categorySlug } = body;

    const effectiveNiche = categorySlug || niche || 'lifestyle';
    const effectiveCategorySlug = categorySlug || niche || 'lifestyle';

    // Fetch persona for users with persona_learning enabled
    let personaOverlay: PersonaOverlay | null = null;
    let performanceBias: PerformanceBias | null = null;

    // Check feature flags from entitlements
    const hasPersonaLearning = entitlements?.features.persona_learning || false;
    const hasPerformanceOptimization = entitlements?.features.performance_optimization || false;

    if (hasPersonaLearning) {
      const { data: persona } = await supabase
        .from('creator_persona_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (persona) {
        personaOverlay = buildPersonaOverlay(persona as CreatorPersonaProfile, true);
      }
    }

    // Get performance bias for users with performance_optimization enabled
    if (hasPerformanceOptimization) {
      performanceBias = await getPerformanceBias(
        supabase,
        user.id,
        platform as Platform,
        categoryGroup as CategoryGroupId,
        effectiveCategorySlug,
        tone as any,
        goal as any
      );
    }

    const startTime = Date.now();

    // Generate hooks with AI
    const hooks = await generateHooks({
      platform: platform as Platform,
      niche: effectiveNiche,
      tone,
      goal,
      locale,
      categoryGroup: categoryGroup as CategoryGroupId,
      categorySlug: effectiveCategorySlug,
      personaOverlay,
      performanceBias,
    });

    const generationTime = Date.now() - startTime;

    // Insert hooks using admin client (bypasses RLS)
    const adminClient = createAdminClient();
    const { data: insertedHooks, error } = await adminClient
      .from('hook_templates')
      .insert(
        hooks.map((hook) => ({
          locale,
          platform,
          niche: effectiveNiche,
          tone,
          hook_text: hook,
          tags: ['generated', goal, platform, categoryGroup],
          is_generated: true,
          category_group: categoryGroup,
          category_slug: effectiveCategorySlug,
        }))
      )
      .select();

    if (error) {
      console.error('Failed to insert generated hooks:', error);
      return NextResponse.json({ error: 'Failed to save hooks' }, { status: 500 });
    }

    // Increment usage counter (1 generation = 1 credit regardless of hook count)
    const hookCount = insertedHooks?.length || 0;
    if (hookCount > 0 && !hasPremiumHooks) {
      // Premium hooks pass bypasses usage tracking
      await incrementUsageAndCheck(supabase, user.id, 'monthly_hooks', 1);
    }

    // Track AI generation for performance optimization
    let generationId: string | null = null;
    if (insertedHooks && insertedHooks.length > 0) {
      // Log persona event for AI learning (if persona_learning enabled)
      if (hasPersonaLearning) {
        await supabase.from('persona_event_logs').insert({
          user_id: user.id,
          event_type: 'generation',
          meta: {
            platform,
            goal,
            tone,
            category_group: categoryGroup,
            category_slug: effectiveCategorySlug,
            type: 'hooks',
            count: insertedHooks.length,
          },
          generation_id: insertedHooks[0].id,
        });
      }

      // Track in ai_generations for performance tracking (if performance_optimization enabled)
      if (hasPerformanceOptimization) {
        generationId = await trackGeneration(supabase, user.id, {
          feature: 'hooks',
          platform: platform as Platform,
          category_group: categoryGroup as CategoryGroupId,
          category_slug: effectiveCategorySlug,
          tone: tone as any,
          goal: goal as any,
          persona_context: personaOverlay ? { enabled: true } : null,
          output_preview: insertedHooks[0]?.hook_text,
          output_count: insertedHooks.length,
          generation_time_ms: generationTime,
          model_used: MODEL,
        });
      }

      // Log activity for user history
      await logActivityWithLocale(supabase, user.id, 'hook_generated', locale, {
        entityType: 'hooks',
        entityId: insertedHooks[0]?.id,
        metadata: {
          count: insertedHooks.length,
          platform,
          tone,
          goal,
          category: effectiveCategorySlug,
        },
      });

      // Complete onboarding steps
      try {
        await supabase.rpc('complete_onboarding_step', {
          p_user_id: user.id,
          p_step_key: 'generate_first_hook',
        });
        await supabase.rpc('complete_onboarding_step', {
          p_user_id: user.id,
          p_step_key: 'pick_platform',
        });
      } catch (e) {
        // Ignore if already completed
      }
    }

    return NextResponse.json({
      success: true,
      hooks: insertedHooks,
      generation_id: generationId,
    });
  } catch (error) {
    console.error('Hook generation error:', error);
    return NextResponse.json({ error: 'Failed to generate hooks' }, { status: 500 });
  }
}

async function generateHooks({
  platform,
  niche,
  tone,
  goal,
  locale,
  categoryGroup,
  categorySlug,
  personaOverlay,
  performanceBias,
}: {
  platform: Platform;
  niche: string;
  tone: string;
  goal: string;
  locale: string;
  categoryGroup: CategoryGroupId;
  categorySlug: string;
  personaOverlay: PersonaOverlay | null;
  performanceBias: PerformanceBias | null;
}): Promise<string[]> {
  const langInstruction =
    locale === 'tr'
      ? 'Yanıtını TAMAMEN Türkçe olarak ver. Tüm hooklar Türkçe olmalı.'
      : 'Provide your response ENTIRELY in English. All hooks must be in English.';

  const platformLabel = {
    tiktok: 'TikTok',
    instagram_reels: 'Instagram Reels',
    instagram_post: 'Instagram Post',
    youtube_shorts: 'YouTube Shorts',
  }[platform];

  // Use centralized prompt builder for platform-specific instructions with category, persona, and performance bias
  const platformPrompt = buildHooksPrompt(locale as 'tr' | 'en', platform, {
    niche: niche as any,
    tone: tone as any,
    goal,
    count: GENERATE_HOOKS_COUNT,
    categoryGroup,
    categorySlug,
    personaOverlay,
    performanceBias,
  });

  const systemPrompt = `You are an expert ${platformLabel} content creator specializing in viral hooks. Your task is to create ${GENERATE_HOOKS_COUNT} unique, attention-grabbing hooks optimized for ${platformLabel}.

${langInstruction}

You MUST respond with ONLY a valid JSON array of objects with "hook_text" property.
Example format: [{"hook_text": "Hook 1"}, {"hook_text": "Hook 2"}, ...]

Requirements for hooks:
- Must grab attention immediately (platform-specific timing)
- Use curiosity gaps, bold claims, or relatable situations
- Should match the specified tone
- Must be suitable for the target niche
- Varied structures optimized for ${platformLabel}
- Optimized for the specified goal

Do not include any text before or after the JSON array. Just output the raw JSON array.`;

  const userPrompt = platformPrompt;

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  let result = content.trim();

  // Clean up potential markdown
  if (result.startsWith('```json')) {
    result = result.slice(7);
  }
  if (result.startsWith('```')) {
    result = result.slice(3);
  }
  if (result.endsWith('```')) {
    result = result.slice(0, -3);
  }

  const parsed = JSON.parse(result);

  if (!Array.isArray(parsed)) {
    throw new Error('Response is not an array');
  }

  // Extract hook text - handle both string array and object array formats
  const hooks: string[] = [];
  for (const item of parsed) {
    if (typeof item === 'string') {
      hooks.push(item);
    } else if (item && typeof item === 'object' && 'hook_text' in item) {
      hooks.push(item.hook_text as string);
    }
  }

  if (hooks.length < 3) {
    throw new Error('Not enough valid hooks generated');
  }

  return hooks.slice(0, GENERATE_HOOKS_COUNT);
}
