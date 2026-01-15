import OpenAI from 'openai';
import type { AnalysisResult, ABTestResult, Locale } from '@/lib/types/database';
import type { Platform } from '@/lib/types/platform';
import type { CategoryGroupId } from '@/lib/types/category';
import { buildAnalysisPrompt } from '@/lib/ai/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10);

const ANALYSIS_SCHEMA = `{
  "hook_score": number (0-100),
  "retention_probability": number (0-100),
  "viral_potential": number (0-100),
  "engagement_score": number (0-100),
  "content_type": string,
  "key_issues": string[],
  "recommended_hooks": string[],
  "editing_instructions": [{ "start_sec": number, "end_sec": number, "instruction": string }],
  "on_screen_text": string[],
  "cover_suggestions": string[],
  "caption_suggestions": string[]
}`;

const AB_TEST_SCHEMA = `{
  "winner": "A" | "B",
  "reasoning": string,
  "improvements": string[]
}`;

function getLanguageInstruction(locale: Locale): string {
  return locale === 'tr'
    ? 'Yanıtını TAMAMEN Türkçe olarak ver. Tüm metin, öneriler ve açıklamalar Türkçe olmalı.'
    : 'Provide your response ENTIRELY in English. All text, suggestions, and explanations must be in English.';
}

export async function analyzeVideo({
  transcript,
  durationSec,
  frameUrls,
  locale,
  platform = 'tiktok',
  categoryGroup = 'creator',
  categorySlug = 'lifestyle',
}: {
  transcript: string | null;
  durationSec: number | null;
  frameUrls: string[];
  locale: Locale;
  platform?: Platform;
  categoryGroup?: CategoryGroupId;
  categorySlug?: string;
}): Promise<AnalysisResult> {
  // Use centralized platform-specific prompt builder with category context
  const prompt = buildAnalysisPrompt(locale as 'tr' | 'en', platform, {
    transcript: transcript || '',
    duration_sec: durationSec || 0,
    frameDescriptions: frameUrls.length > 0 ? [`${frameUrls.length} frames available`] : undefined,
    categoryGroup,
    categorySlug,
  });

  const categoryContext = categoryGroup === 'business'
    ? (locale === 'tr'
        ? 'yerel işletmeler için dönüşüm, teklifler ve güven sinyallerine odaklanarak'
        : 'for local businesses with focus on conversions, offers, and trust signals')
    : (locale === 'tr'
        ? 'içerik üreticileri için etkileşim, kişilik ve topluluk oluşturmaya odaklanarak'
        : 'for content creators with focus on engagement, personality, and community');

  const platformName = platform.replace('_', ' ');

  const systemPrompt = locale === 'tr'
    ? `Sen ${platformName} optimizasyonunda uzman bir içerik analistsin ${categoryContext}. Görevin içeriği analiz etmek ve izlenme ile etkileşimi artırmak için uygulanabilir öneriler sunmaktır.

SADECE geçerli JSON ile yanıt vermelisin. JSON'dan önce veya sonra herhangi bir metin ekleme. Markdown kod blokları kullanma. Sadece ham JSON nesnesini çıktı olarak ver.

TÜM yanıtlarını TÜRKÇE olarak ver. İçerik türü, sorunlar, hooklar, düzenleme talimatları, ekran metinleri, kapak önerileri ve caption önerilerinin hepsi Türkçe olmalıdır.`
    : `You are an expert content analyst specializing in ${platformName} optimization ${categoryContext}. Your task is to analyze content and provide actionable recommendations to increase views and engagement.

You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON. Do not use markdown code blocks. Just output the raw JSON object.`;

  const userPrompt = prompt;

  // Build messages with images if available
  const userContent: OpenAI.ChatCompletionContentPart[] = [
    { type: 'text', text: userPrompt },
  ];

  // Add frame images if available (GPT-4o supports vision)
  for (const url of frameUrls.slice(0, 4)) {
    try {
      userContent.push({
        type: 'image_url',
        image_url: { url, detail: 'low' },
      });
    } catch (error) {
      console.error('Failed to add frame:', error);
    }
  }

  let result = await callOpenAI(systemPrompt, userContent);

  // Validate and retry if needed
  try {
    const parsed = JSON.parse(result);
    validateAnalysisResult(parsed);
    return parsed;
  } catch (error) {
    console.log('First attempt failed, retrying with fix prompt...');
    result = await fixJson(result, ANALYSIS_SCHEMA, locale);
    const parsed = JSON.parse(result);
    validateAnalysisResult(parsed);
    return parsed;
  }
}

export async function predictABTest({
  optionA,
  optionB,
  type,
  locale,
}: {
  optionA: string;
  optionB: string;
  type: 'hook' | 'caption' | 'cover';
  locale: Locale;
}): Promise<ABTestResult> {
  const langInstruction = getLanguageInstruction(locale);

  const typeLabels = {
    hook: locale === 'tr' ? 'video açılış kancası' : 'video hook',
    caption: locale === 'tr' ? 'video açıklaması' : 'video caption',
    cover: locale === 'tr' ? 'kapak metni' : 'cover text',
  };

  const systemPrompt = `You are an expert TikTok content strategist specializing in A/B testing.

${langInstruction}

You MUST respond with ONLY valid JSON matching this exact schema:
${AB_TEST_SCHEMA}

Do not include any text before or after the JSON. Do not use markdown code blocks. Just output the raw JSON object.`;

  const userPrompt = `Compare these two ${typeLabels[type]} options for a TikTok video:

Option A: "${optionA}"

Option B: "${optionB}"

Analyze which option would likely perform better in terms of:
- Click-through rate
- Viewer retention
- Engagement
- Viral potential

Declare a winner and explain your reasoning. Also suggest improvements for both options.

Respond with ONLY the JSON object matching the schema. No additional text.`;

  let result = await callOpenAI(systemPrompt, [{ type: 'text', text: userPrompt }]);

  // Validate and retry if needed
  try {
    const parsed = JSON.parse(result);
    validateABTestResult(parsed);
    return parsed;
  } catch (error) {
    console.log('First attempt failed, retrying with fix prompt...');
    result = await fixJson(result, AB_TEST_SCHEMA, locale);
    const parsed = JSON.parse(result);
    validateABTestResult(parsed);
    return parsed;
  }
}

async function callOpenAI(
  systemPrompt: string,
  userContent: OpenAI.ChatCompletionContentPart[]
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return content.trim();
}

async function fixJson(invalidJson: string, schema: string, locale: Locale): Promise<string> {
  const langInstruction = getLanguageInstruction(locale);

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: 'system',
        content: `You are a JSON fixer. Fix the following invalid JSON to match the schema exactly.

${langInstruction}

Output ONLY the valid JSON. No explanations, no markdown.

Schema:
${schema}`,
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

function validateAnalysisResult(obj: unknown): asserts obj is AnalysisResult {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('Result is not an object');
  }

  const result = obj as Record<string, unknown>;

  const requiredNumbers = [
    'hook_score',
    'retention_probability',
    'viral_potential',
    'engagement_score',
  ];
  for (const field of requiredNumbers) {
    if (typeof result[field] !== 'number') {
      throw new Error(`${field} must be a number`);
    }
  }

  if (typeof result.content_type !== 'string') {
    throw new Error('content_type must be a string');
  }

  const requiredArrays = [
    'key_issues',
    'recommended_hooks',
    'on_screen_text',
    'cover_suggestions',
    'caption_suggestions',
  ];
  for (const field of requiredArrays) {
    if (!Array.isArray(result[field])) {
      throw new Error(`${field} must be an array`);
    }
  }

  if (!Array.isArray(result.editing_instructions)) {
    throw new Error('editing_instructions must be an array');
  }
}

function validateABTestResult(obj: unknown): asserts obj is ABTestResult {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('Result is not an object');
  }

  const result = obj as Record<string, unknown>;

  if (result.winner !== 'A' && result.winner !== 'B') {
    throw new Error('winner must be "A" or "B"');
  }

  if (typeof result.reasoning !== 'string') {
    throw new Error('reasoning must be a string');
  }

  if (!Array.isArray(result.improvements)) {
    throw new Error('improvements must be an array');
  }
}
