import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisResult, ABTestResult, Locale } from '@/lib/types/database';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
});

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS || '4096', 10);

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
}: {
  transcript: string | null;
  durationSec: number | null;
  frameUrls: string[];
  locale: Locale;
}): Promise<AnalysisResult> {
  const langInstruction = getLanguageInstruction(locale);

  const systemPrompt = `You are an expert TikTok content analyst. Your task is to analyze videos and provide actionable recommendations to increase views and engagement.

${langInstruction}

You MUST respond with ONLY valid JSON matching this exact schema:
${ANALYSIS_SCHEMA}

Do not include any text before or after the JSON. Do not use markdown code blocks. Just output the raw JSON object.`;

  const userPrompt = `Analyze this TikTok video:

Duration: ${durationSec ? `${durationSec} seconds` : 'Unknown'}
Transcript: ${transcript || 'No transcript provided'}
Number of frames available: ${frameUrls.length}

Based on the video information provided, analyze the content and provide recommendations to make it more viral. Consider:
1. Hook effectiveness (first 3 seconds)
2. Retention strategies
3. Engagement triggers
4. Content optimization
5. Caption and text overlay suggestions

Respond with ONLY the JSON object matching the schema. No additional text.`;

  const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [
    { type: 'text', text: userPrompt },
  ];

  // Add frame images if available
  for (const url of frameUrls.slice(0, 4)) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mediaType = response.headers.get('content-type') as
        | 'image/jpeg'
        | 'image/png'
        | 'image/gif'
        | 'image/webp';

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType || 'image/png',
          data: base64,
        },
      });
    } catch (error) {
      console.error('Failed to fetch frame:', error);
    }
  }

  let result = await callClaude(systemPrompt, content);

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

  let result = await callClaude(systemPrompt, [{ type: 'text', text: userPrompt }]);

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

async function callClaude(
  systemPrompt: string,
  content: Anthropic.MessageCreateParams['messages'][0]['content']
): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text.trim();
}

async function fixJson(invalidJson: string, schema: string, locale: Locale): Promise<string> {
  const langInstruction = getLanguageInstruction(locale);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: `You are a JSON fixer. Fix the following invalid JSON to match the schema exactly.

${langInstruction}

Output ONLY the valid JSON. No explanations, no markdown.

Schema:
${schema}`,
    messages: [
      {
        role: 'user',
        content: `Fix this JSON:\n\n${invalidJson}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return textBlock.text.trim();
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
