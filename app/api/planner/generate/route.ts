import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { hasProAccess } from '@/lib/admin';
import type { PlanItem, GeneratePlanRequest } from '@/lib/types/planner';
import type { Platform } from '@/lib/types/platform';
import type { CategoryGroupId } from '@/lib/types/category';
import { buildPlannerPrompt } from '@/lib/ai/prompts';
import { buildPersonaOverlay } from '@/lib/types/persona';
import type { CreatorPersonaProfile, PersonaOverlay } from '@/lib/types/persona';
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

const PLAN_SCHEMA = `[
  {
    "day_index": number (1-7),
    "title": string,
    "hook": string,
    "script_outline": string[] (3-6 items),
    "shot_list": string[] (3-6 items),
    "on_screen_text": string[] (2-4 items),
    "cta": string,
    "hashtags": string[] (8-12 items),
    "estimated_duration_seconds": number (15-60)
  }
]`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GeneratePlanRequest = await request.json();
    const { platform = 'tiktok', niche, goal, audience, tone, frequency = 7, locale, categoryGroup = 'creator', categorySlug } = body;

    // Check usage limits
    const usageCheck = await canUseFeature(supabase, user.id, 'content_plans');

    if (usageCheck.status === 'blocked') {
      return NextResponse.json(
        {
          error: 'limit_reached',
          message:
            locale === 'tr'
              ? 'İçerik planı limitine ulaştınız. Planınızı yükseltin.'
              : 'Content plan limit reached. Upgrade your plan.',
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
          used: usageCheck.used,
        },
        { status: 429 }
      );
    }

    // Get effective entitlements for feature flags
    const entitlements = await getEffectiveEntitlements(supabase, user.id);
    const hasPersonaLearning = entitlements?.features.persona_learning || false;

    // Fetch persona for users with persona_learning enabled
    let personaOverlay: PersonaOverlay | null = null;
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

    // Generate plan with AI
    const planItems = await generatePlan({
      platform,
      niche,
      goal,
      audience,
      tone,
      frequency,
      locale,
      categoryGroup,
      categorySlug: categorySlug || niche || 'lifestyle',
      personaOverlay,
    });

    // Save request
    const { data: plannerRequest, error: requestError } = await supabase
      .from('planner_requests')
      .insert({
        user_id: user.id,
        locale,
        platform,
        niche: niche || categorySlug || 'general',
        goal,
        audience,
        tone,
        frequency,
        category_group: categoryGroup,
        category_slug: categorySlug || niche || 'lifestyle',
      })
      .select()
      .single();

    if (requestError) {
      console.error('Failed to save planner request:', requestError);
      return NextResponse.json({ error: 'Failed to save request' }, { status: 500 });
    }

    // Save plan
    const { data: weeklyPlan, error: planError } = await supabase
      .from('weekly_plans')
      .insert({
        user_id: user.id,
        request_id: plannerRequest.id,
        locale,
        platform,
        plan_json: planItems,
        category_group: categoryGroup,
        category_slug: categorySlug || niche || 'lifestyle',
      })
      .select()
      .single();

    if (planError) {
      console.error('Failed to save weekly plan:', planError);
      return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
    }

    // Increment usage counter
    await incrementUsageAndCheck(supabase, user.id, 'content_plans', 1);

    // Log persona event for users with persona_learning enabled
    if (hasPersonaLearning) {
      await supabase.from('persona_event_logs').insert({
        user_id: user.id,
        event_type: 'generation',
        meta: {
          platform,
          goal,
          tone,
          category_group: categoryGroup,
          category_slug: categorySlug || niche || 'lifestyle',
          type: 'planner',
        },
        generation_id: weeklyPlan.id,
      });
    }

    // Log activity for user history
    await logActivityWithLocale(supabase, user.id, 'planner_created', locale, {
      entityType: 'weekly_plan',
      entityId: weeklyPlan.id,
      metadata: {
        platform,
        goal,
        tone,
        frequency,
        category: categorySlug || niche || 'lifestyle',
      },
    });

    return NextResponse.json({
      success: true,
      plan: weeklyPlan,
    });
  } catch (error) {
    console.error('Planner generate error:', error);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}

async function generatePlan({
  platform,
  niche,
  goal,
  audience,
  tone,
  frequency,
  locale,
  categoryGroup,
  categorySlug,
  personaOverlay,
}: {
  platform: Platform;
  niche?: string;
  goal: string;
  audience?: string;
  tone?: string;
  frequency: number;
  locale: string;
  categoryGroup: CategoryGroupId;
  categorySlug: string;
  personaOverlay: PersonaOverlay | null;
}): Promise<PlanItem[]> {
  const langInstruction =
    locale === 'tr'
      ? 'Yanıtını TAMAMEN Türkçe olarak ver. Tüm içerik (başlıklar, hooklar, scriptler, hashtagler dahil) Türkçe olmalı.'
      : 'Provide your response ENTIRELY in English. All content (titles, hooks, scripts, hashtags) must be in English.';

  // Use centralized prompt builder for platform-specific instructions with category and persona
  const platformPrompt = buildPlannerPrompt(locale as 'tr' | 'en', platform, {
    niche: niche as any,
    goal: goal as any,
    audience,
    tone: tone as any,
    frequency,
    categoryGroup,
    categorySlug,
    personaOverlay,
  });

  const platformLabel = {
    tiktok: 'TikTok',
    instagram_reels: 'Instagram Reels',
    instagram_post: 'Instagram Post/Carousel',
    youtube_shorts: 'YouTube Shorts',
  }[platform];

  const systemPrompt = `You are an expert ${platformLabel} content strategist. Your task is to create detailed weekly content plans that are practical, trend-aware, and optimized for viral potential on ${platformLabel}.

${langInstruction}

You MUST respond with ONLY valid JSON matching this exact schema (array of ${frequency} items):
${PLAN_SCHEMA}

Requirements:
- Create exactly ${frequency} unique content ideas optimized for ${platformLabel}
- Each idea should be practical and actionable
- Include current trends and viral formats for ${platformLabel}
- Hooks must be attention-grabbing (platform-specific)
- Script outlines should be detailed enough to film
- Hashtags should follow ${platformLabel} best practices
- Duration should be realistic for ${platformLabel}

Do not include any text before or after the JSON. Do not use markdown code blocks. Just output the raw JSON array.`;

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

  // Try to parse and validate
  try {
    const parsed = JSON.parse(result);
    validatePlanItems(parsed, frequency);
    return parsed;
  } catch (error) {
    console.log('First attempt failed, retrying with fix prompt...');
    result = await fixPlanJson(result, frequency, locale);
    const parsed = JSON.parse(result);
    validatePlanItems(parsed, frequency);
    return parsed;
  }
}

async function fixPlanJson(invalidJson: string, frequency: number, locale: string): Promise<string> {
  const langInstruction =
    locale === 'tr'
      ? 'Yanıtını TAMAMEN Türkçe olarak ver.'
      : 'Provide your response ENTIRELY in English.';

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: 'system',
        content: `You are a JSON fixer. Fix the following invalid JSON to match the schema exactly.

${langInstruction}

Output ONLY the valid JSON array of ${frequency} items. No explanations, no markdown.

Schema for each item:
${PLAN_SCHEMA}`,
      },
      {
        role: 'user',
        content: `Fix this JSON:\n\n${invalidJson}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return content.trim();
}

function validatePlanItems(obj: unknown, expectedCount: number): asserts obj is PlanItem[] {
  if (!Array.isArray(obj)) {
    throw new Error('Result is not an array');
  }

  if (obj.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} items, got ${obj.length}`);
  }

  for (const item of obj) {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Item is not an object');
    }

    const plan = item as Record<string, unknown>;

    if (typeof plan.day_index !== 'number') throw new Error('day_index must be a number');
    if (typeof plan.title !== 'string') throw new Error('title must be a string');
    if (typeof plan.hook !== 'string') throw new Error('hook must be a string');
    if (!Array.isArray(plan.script_outline)) throw new Error('script_outline must be an array');
    if (!Array.isArray(plan.shot_list)) throw new Error('shot_list must be an array');
    if (!Array.isArray(plan.on_screen_text)) throw new Error('on_screen_text must be an array');
    if (typeof plan.cta !== 'string') throw new Error('cta must be a string');
    if (!Array.isArray(plan.hashtags)) throw new Error('hashtags must be an array');
    if (typeof plan.estimated_duration_seconds !== 'number')
      throw new Error('estimated_duration_seconds must be a number');
  }
}

function getStartOfWeek(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}
