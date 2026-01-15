import type { Platform } from '@/lib/types/platform';
import type { Niche, Tone, Goal } from '@/lib/types/planner';
import type { CategoryGroupId } from '@/lib/types/category';
import type { PersonaOverlay, ToneType, CTAStyle, PacingType } from '@/lib/types/persona';
import type { PerformanceBias } from '@/lib/types/performance';

// ============================================
// PERSONA OVERLAY PROMPT BUILDER
// ============================================

function buildPersonaPromptSection(persona: PersonaOverlay | null | undefined): string {
  if (!persona || !persona.enabled) {
    return '';
  }

  const toneDescriptions: Record<ToneType, { tr: string; en: string }> = {
    funny: { tr: 'Eğlenceli ve komik', en: 'Funny and humorous' },
    serious: { tr: 'Ciddi ve profesyonel', en: 'Serious and professional' },
    educational: { tr: 'Eğitici ve bilgilendirici', en: 'Educational and informative' },
    controversial: { tr: 'Tartışmalı ve dikkat çekici', en: 'Controversial and attention-grabbing' },
    inspirational: { tr: 'İlham verici ve motive edici', en: 'Inspirational and motivating' },
  };

  const ctaDescriptions: Record<CTAStyle, { tr: string; en: string }> = {
    soft: { tr: 'Yumuşak (öneri tarzında)', en: 'Soft (suggestive)' },
    direct: { tr: 'Direkt (açık çağrı)', en: 'Direct (clear call)' },
    urgent: { tr: 'Acil (sınırlı süre/fırsat)', en: 'Urgent (limited time/opportunity)' },
    question: { tr: 'Soru ile (etkileşim odaklı)', en: 'Question-based (engagement focused)' },
  };

  const pacingDescriptions: Record<PacingType, { tr: string; en: string }> = {
    fast: { tr: 'Hızlı tempo, kısa cümleler', en: 'Fast pace, short sentences' },
    medium: { tr: 'Orta tempo, dengeli akış', en: 'Medium pace, balanced flow' },
    slow: { tr: 'Yavaş tempo, detaylı anlatım', en: 'Slow pace, detailed narration' },
  };

  const openingDescriptions: Record<string, { tr: string; en: string }> = {
    question: { tr: 'Soru ile başla', en: 'Start with a question' },
    statement: { tr: 'Güçlü bir ifade ile başla', en: 'Start with a strong statement' },
    statistic: { tr: 'İstatistik/veri ile başla', en: 'Start with a statistic/data' },
    story: { tr: 'Hikaye anlatımı ile başla', en: 'Start with storytelling' },
    challenge: { tr: 'Meydan okuma ile başla', en: 'Start with a challenge' },
  };

  const formatDescriptions: Record<string, { tr: string; en: string }> = {
    listicle: { tr: 'Liste formatı', en: 'Listicle format' },
    story: { tr: 'Hikaye formatı', en: 'Story format' },
    tutorial: { tr: 'Eğitim/how-to formatı', en: 'Tutorial/how-to format' },
    reaction: { tr: 'Tepki/yorum formatı', en: 'Reaction/commentary format' },
    comparison: { tr: 'Karşılaştırma formatı', en: 'Comparison format' },
  };

  // Build persona overlay section
  let section = `
CREATOR PERSONA OVERLAY (Personalized AI Guidance):
This creator has established preferences based on their past successful content.
Apply these biases to align output with their proven style:

`;

  // Add dominant tone
  if (persona.tone_preference) {
    const desc = toneDescriptions[persona.tone_preference];
    section += `- Primary Tone: ${desc.en} (${desc.tr})\n`;
  }

  // Add preferred opening style
  if (persona.opening_preference) {
    const desc = openingDescriptions[persona.opening_preference];
    if (desc) {
      section += `- Opening Style: ${desc.en} (${desc.tr})\n`;
    }
  }

  // Add preferred format
  if (persona.format_preference) {
    const desc = formatDescriptions[persona.format_preference];
    if (desc) {
      section += `- Content Format: ${desc.en} (${desc.tr})\n`;
    }
  }

  // Add CTA style
  if (persona.cta_style) {
    const desc = ctaDescriptions[persona.cta_style];
    section += `- CTA Style: ${desc.en} (${desc.tr})\n`;
  }

  // Add hook length preference
  if (persona.target_hook_length) {
    const hookDesc = persona.target_hook_length <= 8
      ? 'Short and punchy (under 8 words)'
      : persona.target_hook_length <= 12
        ? 'Medium length (8-12 words)'
        : 'Longer, more detailed (12+ words)';
    section += `- Hook Length: ${hookDesc}\n`;
  }

  // Add pacing preference
  if (persona.pacing) {
    const desc = pacingDescriptions[persona.pacing];
    section += `- Pacing: ${desc.en} (${desc.tr})\n`;
  }

  // Add performance insights if available
  if (persona.performance_insights.best_tone) {
    const bestToneDesc = toneDescriptions[persona.performance_insights.best_tone];
    section += `- Best Performing Tone: ${bestToneDesc.en}\n`;
  }

  section += `
IMPORTANT: Use these preferences as guidance, but maintain quality and platform best practices.
The persona overlay helps match the creator's established voice and style.
`;

  return section;
}

// ============================================
// PERFORMANCE BIAS PROMPT BUILDER
// ============================================

function buildPerformanceBiasSection(bias: PerformanceBias | null | undefined): string {
  if (!bias || bias.weighted_score < 1) {
    return '';
  }

  let section = `
PERFORMANCE DATA INSIGHTS (Based on this creator's actual results):
This creator has tracked their content performance. Use these insights to optimize output:

`;

  // Add performance metrics
  if (bias.avg_views > 0) {
    section += `- Average Views: ${Math.round(bias.avg_views).toLocaleString()} views per content\n`;
  }

  if (bias.avg_engagement_rate > 0) {
    section += `- Average Engagement Rate: ${bias.avg_engagement_rate.toFixed(1)}%\n`;
  }

  // Add best performing context
  if (bias.tone) {
    section += `- Best Performing Tone: ${bias.tone}\n`;
  }

  if (bias.goal) {
    section += `- Best Performing Goal: ${bias.goal}\n`;
  }

  // Add recommendation if available
  if (bias.recommendation) {
    section += `
OPTIMIZATION RECOMMENDATION:
${bias.recommendation}
`;
  }

  // Add best performing example
  if (bias.best_performing_preview) {
    section += `
BEST PERFORMING EXAMPLE (use as style reference):
"${bias.best_performing_preview}"
`;
  }

  section += `
IMPORTANT: Prioritize patterns similar to this creator's proven successful content.
Maintain the style and approach that has worked well for them.
`;

  return section;
}

// ============================================
// CATEGORY-SPECIFIC PROMPT MODIFIERS
// ============================================

const CREATOR_PROMPT_CONTEXT: Record<'tr' | 'en', string> = {
  tr: `
İÇERİK ÜRETİCİ BAĞLAMI:
Bu içerik kişisel marka/içerik üreticisi içindir. Odaklan:
- Kişisel hikaye anlatımı ve POV içerikleri
- İzleyicilerle parasosyal ilişki kurma
- Trend katılımı ve challenge'lar
- Kişilik odaklı aksiyona çağrı
- Özgünlük ve ilişkilendirilebilirlik
- Topluluk oluşturma (yorumlar, hayranlardan DM'ler)
`,
  en: `
CREATOR CONTEXT:
This content is for a personal brand/content creator. Focus on:
- Personal storytelling and POV content
- Building parasocial relationships with audience
- Trend participation and challenges
- Personality-driven calls-to-action
- Authenticity and relatability
- Community building (comments, DMs from fans)
`
};

const BUSINESS_PROMPT_CONTEXT: Record<'tr' | 'en', string> = {
  tr: `
İŞLETME BAĞLAMI:
Bu içerik yerel bir işletme veya marka içindir. Odaklan:
- Teklif odaklı hooklar (indirimler, sınırlı süre, özel fırsatlar)
- Sosyal kanıt (yorumlar, referanslar, öncesi/sonrası)
- Güven sinyalleri (sektördeki yıllar, sertifikalar, ödüller)
- Doğrudan dönüşüm CTA'ları (Hemen rezervasyon yap, DM at, Linke tıkla, Bugün ara)
- Konum belirtmeleri ve yerel hashtagler
- Hizmet/ürün tanıtımı
- İşletmenin perde arkası
- Müşteri başarı hikayeleri
`,
  en: `
BUSINESS CONTEXT:
This content is for a local business or brand. Focus on:
- Offer-driven hooks (discounts, limited time, special deals)
- Social proof (reviews, testimonials, before/after)
- Trust signals (years in business, certifications, awards)
- Direct conversion CTAs (Book now, DM for reservation, Visit link, Call today)
- Location mentions and local hashtags
- Service/product showcase
- Behind-the-scenes of the business
- Customer success stories
`
};

const BUSINESS_PLATFORM_ADDITIONS: Record<Platform, Record<'tr' | 'en', string>> = {
  tiktok: {
    tr: `
İŞLETME TikTok Özellikleri:
- Hook: Problem/çözüm veya "Bu dönüşümü izle"
- Hızlı kanıt: İlk 3 saniyede sonucu göster
- CTA: "Link bio'da" veya "Detay için 'BİLGİ' yaz"
- Sosyal kanıt: "500+ mutlu müşteri"`,
    en: `
BUSINESS TikTok Specifics:
- Hook: Problem/solution or "Watch this transformation"
- Fast proof: Show result in first 3 seconds
- CTA: "Link in bio" or "DM 'INFO' for details"
- Social proof flash: "500+ happy customers"`
  },

  instagram_reels: {
    tr: `
İŞLETME Instagram Reels Özellikleri:
- İlk karede teklif
- Her zaman konum etiketi
- Caption: Teklif detayları + rezervasyon bilgisi + konum
- Story link entegrasyonu
- Hashtagler: Konum bazlı etiketler dahil et`,
    en: `
BUSINESS Instagram Reels Specifics:
- Offer in first frame
- Location tag always
- Caption: Offer details + booking info + location
- Story link integration
- Hashtags: Include location-based tags`
  },

  instagram_post: {
    tr: `
İŞLETME Instagram Post Özellikleri:
- Slayt 1: Teklif veya dönüşüm
- Fiyat/teklif detaylarını dahil et
- Caption'da konum
- İletişim bilgisi belirgin şekilde
- CTA'da Google Maps/yol tarifi
- Yerel topluluk hashtagleri`,
    en: `
BUSINESS Instagram Post Specifics:
- Slide 1: Offer or transformation
- Include pricing/offer details
- Location in caption
- Contact info prominently displayed
- Google Maps/direction in CTA
- Local community hashtags`
  },

  youtube_shorts: {
    tr: `
İŞLETME YouTube Shorts Özellikleri:
- Başlık: Konum veya hizmet türünü dahil et
- Açıklama: Tam adres + rezervasyon linki
- Yerel SEO anahtar kelimeleri
- Abone ol CTA'sı sadece düzenli içerik varsa`,
    en: `
BUSINESS YouTube Shorts Specifics:
- Title: Include location or service type
- Description: Full address + booking link
- Local SEO keywords
- Subscribe CTA only if channel has regular content`
  },
};

function getCategoryContext(categoryGroup: CategoryGroupId, platform: Platform, locale: 'tr' | 'en' = 'tr'): string {
  if (categoryGroup === 'business') {
    return BUSINESS_PROMPT_CONTEXT[locale] + BUSINESS_PLATFORM_ADDITIONS[platform][locale];
  }
  return CREATOR_PROMPT_CONTEXT[locale];
}

// Platform-specific prompt sections
const PLATFORM_ANALYSIS_FOCUS: Record<Platform, Record<'tr' | 'en', string>> = {
  tiktok: {
    tr: `
PLATFORM: TikTok
Odak Alanları:
- Hook optimizasyonu (ilk 1-3 saniye kritik)
- Hızlı tempo ve izleyici tutma teknikleri
- Trend sesler/müzik uyumluluğu
- Ekran metni önerileri
- Minimal hashtagler (maksimum 3-5, niş + trend karışımı)
- Dikey 9:16 format optimizasyonu
- İzlenme süresi için döngü potansiyeli`,
    en: `
PLATFORM: TikTok
Focus Areas:
- Hook optimization (first 1-3 seconds critical)
- Fast pacing and retention techniques
- Trending sounds/music compatibility
- On-screen text overlay suggestions
- Minimal hashtags (3-5 max, mix of niche + trending)
- Vertical 9:16 format optimization
- Loop potential for watch time`
  },

  instagram_reels: {
    tr: `
PLATFORM: Instagram Reels
Odak Alanları:
- Kapak karesiyle güçlü görsel hook
- Caption stratejisi (ilgi çekici ilk satır, hikaye anlatımı)
- Hashtag seti: 5 niş + 5 erişim/keşif + 3 marka
- Kaydırmayı durduran kapak metni
- Instagram için optimize CTA (kaydet, paylaş, takip et)
- Feed'e çapraz paylaşım potansiyeli
- Keşfet sayfası optimizasyonu`,
    en: `
PLATFORM: Instagram Reels
Focus Areas:
- Strong visual hook with cover frame
- Caption strategy (engaging first line, storytelling)
- Hashtag set: 5 niche-specific + 5 reach/discovery + 3 branded
- Cover text that stops the scroll
- CTA optimized for Instagram (save, share, follow)
- Cross-posting potential to Feed
- Explore page optimization`
  },

  instagram_post: {
    tr: `
PLATFORM: Instagram Post (Statik/Carousel)
Odak Alanları:
- İlk slayt hook'u (kaydırmayı durdurmalı)
- Carousel yapısı: net ilerleme ile 5-8 slayt
- İlk satırda hook ile uzun caption
- Slaytlar boyunca hikaye akışı
- Hashtag stratejisi: 10 niş + 10 erişim + 5 marka (30'a kadar)
- Son slayt ve caption'da aksiyon çağrısı
- En iyi paylaşım zamanı önerileri
- Etkileşim teşvikleri (sorular, story anketleri)`,
    en: `
PLATFORM: Instagram Post (Static/Carousel)
Focus Areas:
- First slide hook (must stop the scroll)
- Carousel structure: 5-8 slides with clear progression
- Long-form caption with hook in first line
- Storytelling arc across slides
- Hashtag strategy: 10 niche + 10 reach + 5 branded (up to 30)
- Call-to-action in last slide and caption
- Best posting time suggestions
- Engagement prompts (questions, polls in stories)`
  },

  youtube_shorts: {
    tr: `
PLATFORM: YouTube Shorts
Odak Alanları:
- Başlık öncelikli yaklaşım (videonun altında görünür)
- İzleyici tutma eğrisi optimizasyonu
- Abone ol CTA entegrasyonu
- Anahtar kelime zengin açıklama (SEO)
- Kısa etiketler (5-8 ilgili anahtar kelime)
- Varsa küçük resim
- Kanal marka tutarlılığı
- Bitiş ekranı zamanlaması`,
    en: `
PLATFORM: YouTube Shorts
Focus Areas:
- Title-first approach (appears below video)
- Retention curve optimization
- Subscribe CTA integration
- Keyword-rich description (SEO)
- Concise tags (5-8 relevant keywords)
- Thumbnail if applicable
- Channel branding consistency
- End screen timing`
  },
};

const PLATFORM_PLANNER_STRUCTURE: Record<Platform, Record<'tr' | 'en', string>> = {
  tiktok: {
    tr: `
TikTok İçin İçerik Yapısı:
- Hook: İlk 1-3 saniyede dikkat çekici
- Senaryo: Hızlı tempolu, vurucu anlatım
- Ekran metni: Kalın, okunabilir katmanlar
- Süre: 15-60 saniye optimal
- CTA: Takip et, beğen veya yorum yap
- Hashtagler: 3-5 stratejik etiket`,
    en: `
Content Structure for TikTok:
- Hook: Attention-grabbing first 1-3 seconds
- Script: Fast-paced, punchy delivery
- On-screen text: Bold, readable overlays
- Duration: 15-60 seconds optimal
- CTA: Follow, like, or comment prompt
- Hashtags: 3-5 strategic tags`
  },

  instagram_reels: {
    tr: `
Instagram Reels İçin İçerik Yapısı:
- Hook: İlk saniyede görsel + metin hook'u
- Kapak karesi: Çekici küçük resim tasarla
- Senaryo: Eğlence + değer dengesi
- Caption: Kişilikli uzun format
- Süre: 15-30 saniye optimal
- CTA: Bunu kaydet, arkadaşınla paylaş, daha fazlası için takip et
- Hashtagler: Toplam 13 (5 niş + 5 erişim + 3 marka)`,
    en: `
Content Structure for Instagram Reels:
- Hook: Visual + text hook in first second
- Cover frame: Design compelling thumbnail
- Script: Balance entertainment + value
- Caption: Long-form with personality
- Duration: 15-30 seconds optimal
- CTA: Save this, share with friend, follow for more
- Hashtags: 13 total (5 niche + 5 reach + 3 branded)`
  },

  instagram_post: {
    tr: `
Instagram Post İçin İçerik Yapısı:
- Slayt 1: Hook slaytı (kaydırmayı durdur)
- Slayt 2-7: Değer/hikaye ilerlemesi
- Son slayt: Güçlü CTA
- Caption: Hook satırı + hikaye + CTA + hashtagler
- Hashtagler: 30'a kadar (yorumlarda veya caption'da gizli)
- Etkileşim: Soru veya anket
- Paylaşım zamanı: Optimal saatleri öner`,
    en: `
Content Structure for Instagram Post:
- Slide 1: Hook slide (stop the scroll)
- Slides 2-7: Value/story progression
- Final slide: Strong CTA
- Caption: Hook line + story + CTA + hashtags
- Hashtags: Up to 30 (hidden in comments or caption)
- Engagement: Question or poll prompt
- Posting time: Suggest optimal hours`
  },

  youtube_shorts: {
    tr: `
YouTube Shorts İçin İçerik Yapısı:
- Başlık: SEO optimize, merak uyandıran
- Hook: İlk 2 saniyede kalıp kırıcı
- Senaryo: Net değer sunumu
- Süre: 30-60 saniye optimal
- CTA: Abone ol hatırlatması
- Açıklama: Anahtar kelimeler + linkler
- Etiketler: 5-8 ilgili anahtar kelime`,
    en: `
Content Structure for YouTube Shorts:
- Title: SEO-optimized, curiosity-driven
- Hook: Pattern interrupt in first 2 seconds
- Script: Clear value delivery
- Duration: 30-60 seconds optimal
- CTA: Subscribe reminder
- Description: Keywords + links
- Tags: 5-8 relevant keywords`
  },
};

const PLATFORM_HOOKS_STYLE: Record<Platform, Record<'tr' | 'en', string>> = {
  tiktok: {
    tr: `
TikTok Hook Stili:
- Kalıp kırıcılar ("Dur, biliyor muydun...")
- Tartışmalı/cesur fikirler
- "POV" senaryoları
- Trend ses referansları
- Hızlı kesimler/hareketler
- Ekranda metin hook'ları`,
    en: `
TikTok Hook Style:
- Pattern interrupts ("Wait, did you know...")
- Controversy/hot takes
- "POV" scenarios
- Trending audio references
- Quick cuts/movements
- Text hooks on screen`
  },

  instagram_reels: {
    tr: `
Instagram Reels Hook Stili:
- Görsel dönüşüm hook'ları
- "Sonuna kadar izle" vaatleri
- Öncesi/sonrası açılımları
- Estetik geçişler
- Videoyu tamamlayan caption hook'ları
- Merak uyandıran kapak metni`,
    en: `
Instagram Reels Hook Style:
- Visual transformation hooks
- "Watch until the end" promises
- Before/after reveals
- Aesthetic transitions
- Caption hooks that complement video
- Cover text that creates curiosity`
  },

  instagram_post: {
    tr: `
Instagram Post Hook Stili:
- Cesur ifadeli ilk slaytlar
- "Öğrenmek için kaydır" carousel'ları
- Veri/istatistik hook'ları
- Alıntı grafikleri
- Dönüşüm postları
- Liste tabanlı değer postları`,
    en: `
Instagram Post Hook Style:
- Bold statement first slides
- "Swipe to learn" carousels
- Data/statistic hooks
- Quote graphics
- Transformation posts
- List-based value posts`
  },

  youtube_shorts: {
    tr: `
YouTube Shorts Hook Stili:
- Başlık + görsel hook kombinasyonu
- "X saniyede" vaatleri
- Şaşırtıcı gerçekler/açılımlar
- Eğitim teaserları
- Challenge hook'ları
- Hikaye hook'ları`,
    en: `
YouTube Shorts Hook Style:
- Title + visual hook combo
- "In X seconds" promises
- Surprising facts/reveals
- Tutorial teasers
- Challenge hooks
- Story hooks`
  },
};

// ============================================
// ANALYSIS PROMPTS
// ============================================

export interface AnalysisPromptInputs {
  transcript: string;
  duration_sec: number;
  frameDescriptions?: string[];
  categoryGroup?: CategoryGroupId;
  categorySlug?: string;
  personaOverlay?: PersonaOverlay | null;
  performanceBias?: PerformanceBias | null;
}

export function buildAnalysisPrompt(
  locale: 'tr' | 'en',
  platform: Platform,
  inputs: AnalysisPromptInputs
): string {
  const languageInstruction = locale === 'tr'
    ? 'Tüm yanıtlarını Türkçe olarak ver.'
    : 'Provide all responses in English.';

  const platformFocus = PLATFORM_ANALYSIS_FOCUS[platform][locale];
  const categoryGroup = inputs.categoryGroup || 'creator';
  const categoryContext = getCategoryContext(categoryGroup, platform, locale);
  const personaSection = buildPersonaPromptSection(inputs.personaOverlay);
  const performanceSection = buildPerformanceBiasSection(inputs.performanceBias);

  const businessOutputAdditions = categoryGroup === 'business' ? `,
  "offer_suggestions": ["<offer idea 1>", "<offer idea 2>"],
  "social_proof_hooks": ["<proof hook 1>", "<proof hook 2>"],
  "local_cta": "<booking/contact call-to-action>"` : '';

  const basePrompt = `You are an expert content analyst specializing in short-form video optimization.
${languageInstruction}

${platformFocus}

${categoryContext}
${personaSection}
${performanceSection}
CATEGORY: ${categoryGroup.toUpperCase()} - ${inputs.categorySlug || 'general'}

Analyze the following content and provide optimization recommendations.

CONTENT DETAILS:
- Duration: ${inputs.duration_sec} seconds
- Transcript: ${inputs.transcript || 'No transcript provided'}
${inputs.frameDescriptions ? `- Visual frames: ${inputs.frameDescriptions.join(', ')}` : ''}

REQUIRED OUTPUT (JSON format):
{
  "hook_score": <number 0-100>,
  "retention_probability": <number 0-100>,
  "viral_potential": <number 0-100>,
  "engagement_score": <number 0-100>,
  "content_type": "<string describing content category>",
  "key_issues": ["<issue1>", "<issue2>", ...],
  "recommended_hooks": ["<hook1>", "<hook2>", "<hook3>"],
  "editing_instructions": [
    {"start_sec": <number>, "end_sec": <number>, "instruction": "<what to change>"}
  ],
  "on_screen_text": ["<text suggestion 1>", "<text suggestion 2>"],
  "cover_suggestions": ["<cover idea 1>", "<cover idea 2>"],
  "caption_suggestions": ["<caption 1>", "<caption 2>"]${platform === 'instagram_post' ? `,
  "carousel_slides": [
    {"slide_number": 1, "text": "<slide content>", "visual_suggestion": "<what to show>"}
  ],
  "posting_time_suggestions": ["<time1>", "<time2>"]` : ''}${platform === 'instagram_reels' || platform === 'instagram_post' ? `,
  "hashtag_sets": {
    "niche": ["<tag1>", "<tag2>", ...],
    "reach": ["<tag1>", "<tag2>", ...],
    "branded": ["<tag1>", "<tag2>", ...]${categoryGroup === 'business' ? `,
    "local": ["<location tag 1>", "<location tag 2>", ...]` : ''}
  }` : ''}${platform === 'youtube_shorts' ? `,
  "title_suggestions": ["<title1>", "<title2>"],
  "keywords": ["<keyword1>", "<keyword2>", ...]` : ''}${businessOutputAdditions}
}

Respond ONLY with valid JSON. No additional text.`;

  return basePrompt;
}

// ============================================
// PLANNER PROMPTS
// ============================================

export interface PlannerPromptInputs {
  niche?: Niche;
  goal: Goal;
  audience?: string;
  tone?: Tone;
  frequency: number;
  categoryGroup?: CategoryGroupId;
  categorySlug?: string;
  personaOverlay?: PersonaOverlay | null;
  performanceBias?: PerformanceBias | null;
}

export function buildPlannerPrompt(
  locale: 'tr' | 'en',
  platform: Platform,
  inputs: PlannerPromptInputs
): string {
  const languageInstruction = locale === 'tr'
    ? 'Tüm yanıtlarını Türkçe olarak ver.'
    : 'Provide all responses in English.';

  const platformStructure = PLATFORM_PLANNER_STRUCTURE[platform][locale];
  const categoryGroup = inputs.categoryGroup || 'creator';
  const categoryContext = getCategoryContext(categoryGroup, platform, locale);
  const personaSection = buildPersonaPromptSection(inputs.personaOverlay);
  const performanceSection = buildPerformanceBiasSection(inputs.performanceBias);

  const goalDescriptions: Record<Goal, { tr: string; en: string }> = {
    views: { tr: 'İzlenme sayısını artırmak', en: 'Increase views' },
    followers: { tr: 'Takipçi kazanmak', en: 'Gain followers' },
    engagement: { tr: 'Etkileşimi artırmak', en: 'Boost engagement' },
    sales: { tr: 'Satış dönüşümü', en: 'Drive sales' },
  };

  // Business-specific output additions
  const businessOutputAdditions = categoryGroup === 'business' ? `,
    "offer_angle": "<what offer/deal to highlight>",
    "proof_angle": "<what social proof to show: reviews, before/after, testimonial>",
    "local_cta": "<booking/location/contact CTA>"` : '';

  const categoryLabel = inputs.categorySlug || inputs.niche || 'general';

  const basePrompt = `You are an expert content strategist for ${platform.replace('_', ' ')}.
${languageInstruction}

${platformStructure}

${categoryContext}
${personaSection}
${performanceSection}
Create a ${inputs.frequency}-day content plan for:
- Category: ${categoryGroup.toUpperCase()} - ${categoryLabel}
- Goal: ${goalDescriptions[inputs.goal][locale]}
${inputs.audience ? `- Target Audience: ${inputs.audience}` : ''}
${inputs.tone ? `- Tone: ${inputs.tone}` : ''}

${categoryGroup === 'business' ? `
BUSINESS CONTENT MIX (vary across the week):
- Day 1-2: Offer/promotion focused
- Day 3: Behind-the-scenes or team showcase
- Day 4: Customer testimonial or before/after
- Day 5: Educational/tips content
- Day 6-7: Service showcase or transformation
` : ''}

REQUIRED OUTPUT (JSON array):
[
  {
    "day_index": 1,
    "title": "<content title>",
    "hook": "<opening hook text>",
    "script_outline": ["<point 1>", "<point 2>", "<point 3>"],
    "shot_list": ["<shot 1>", "<shot 2>", "<shot 3>"],
    "on_screen_text": ["<overlay 1>", "<overlay 2>"],
    "cta": "<call to action>",
    "hashtags": ["tag1", "tag2", ...],
    "estimated_duration_seconds": <number>${platform === 'instagram_post' ? `,
    "carousel_slides": [
      {"slide_number": 1, "headline": "<text>", "body": "<supporting text>"}
    ],
    "caption_full": "<full caption with emojis and formatting>"` : ''}${platform === 'youtube_shorts' ? `,
    "video_title": "<SEO optimized title>",
    "description": "<keyword-rich description>",
    "tags": ["<tag1>", "<tag2>", ...]` : ''}${businessOutputAdditions}
  },
  ...
]

Generate exactly ${inputs.frequency} items, one for each day.
Respond ONLY with valid JSON array. No additional text.`;

  return basePrompt;
}

// ============================================
// HOOKS PROMPTS
// ============================================

export interface HooksPromptInputs {
  niche?: Niche;
  tone: Tone;
  goal: string;
  count?: number;
  categoryGroup?: CategoryGroupId;
  categorySlug?: string;
  personaOverlay?: PersonaOverlay | null;
  performanceBias?: PerformanceBias | null;
}

export function buildHooksPrompt(
  locale: 'tr' | 'en',
  platform: Platform,
  inputs: HooksPromptInputs
): string {
  const languageInstruction = locale === 'tr'
    ? 'Tüm hook\'ları Türkçe olarak yaz.'
    : 'Write all hooks in English.';

  const platformStyle = PLATFORM_HOOKS_STYLE[platform][locale];
  const count = inputs.count || 20;
  const categoryGroup = inputs.categoryGroup || 'creator';
  const categoryLabel = inputs.categorySlug || inputs.niche || 'general';
  const personaSection = buildPersonaPromptSection(inputs.personaOverlay);
  const performanceSection = buildPerformanceBiasSection(inputs.performanceBias);

  const businessHookGuidelines = categoryGroup === 'business' ? `
BUSINESS HOOK TYPES (include variety):
- Offer hooks: "Limited time: 20% off...", "Today only..."
- Social proof hooks: "Why 500+ customers choose us...", "See what our clients say..."
- Transformation hooks: "Before vs after...", "Watch this result..."
- Trust hooks: "10 years of experience...", "Award-winning..."
- Urgency hooks: "Only 3 spots left...", "Booking fast..."
- Location hooks: "[City]'s best kept secret...", "If you're in [area]..."
- Problem/solution: "Tired of [problem]? Here's how we fix it..."
` : `
CREATOR HOOK TYPES (include variety):
- POV hooks: "POV: You're...", "That moment when..."
- Story hooks: "I can't believe this happened...", "Here's why I stopped..."
- Controversial: "Hot take:", "Unpopular opinion:"
- Curiosity gaps: "The secret no one talks about...", "This changed everything..."
- Relatable: "Tell me you're a [niche] without telling me..."
- Trend participation: Reference current trends and sounds
`;

  const basePrompt = `You are a viral content copywriter specializing in ${platform.replace('_', ' ')} hooks.
${languageInstruction}

${platformStyle}

${businessHookGuidelines}
${personaSection}
${performanceSection}
Generate ${count} unique, attention-grabbing hooks for:
- Category: ${categoryGroup.toUpperCase()} - ${categoryLabel}
- Tone: ${inputs.tone}
- Goal: ${inputs.goal}

Requirements:
- Each hook must be platform-optimized
- Hooks should be varied in structure (use ALL hook types listed above)
- Maximum 150 characters per hook
- No repetitive patterns
${categoryGroup === 'business' ? '- Include specific offers/numbers when possible\n- Make hooks conversion-focused' : '- Make hooks personality-driven\n- Create emotional connections'}

REQUIRED OUTPUT (JSON array):
[
  {"hook_text": "<hook 1>"},
  {"hook_text": "<hook 2>"},
  ...
]

Generate exactly ${count} hooks.
Respond ONLY with valid JSON array. No additional text.`;

  return basePrompt;
}

// ============================================
// A/B TEST PROMPTS
// ============================================

export interface ABTestPromptInputs {
  optionA: string;
  optionB: string;
  type: 'hook' | 'caption' | 'cover';
  personaOverlay?: PersonaOverlay | null;
  performanceBias?: PerformanceBias | null;
}

export function buildABTestPrompt(
  locale: 'tr' | 'en',
  platform: Platform,
  inputs: ABTestPromptInputs
): string {
  const languageInstruction = locale === 'tr'
    ? 'Yanıtını Türkçe olarak ver.'
    : 'Provide your response in English.';

  const typeLabels = {
    hook: { tr: 'açılış hook\'u', en: 'opening hook' },
    caption: { tr: 'açıklama metni', en: 'caption' },
    cover: { tr: 'kapak metni', en: 'cover text' },
  };

  const personaSection = buildPersonaPromptSection(inputs.personaOverlay);
  const performanceSection = buildPerformanceBiasSection(inputs.performanceBias);

  const basePrompt = `You are an A/B testing expert for ${platform.replace('_', ' ')} content.
${languageInstruction}
${personaSection}
${performanceSection}
Compare these two ${typeLabels[inputs.type][locale]} options:

OPTION A: "${inputs.optionA}"

OPTION B: "${inputs.optionB}"

Analyze which will perform better on ${platform.replace('_', ' ')} and why.

REQUIRED OUTPUT (JSON):
{
  "winner": "<A or B>",
  "reasoning": "<detailed explanation>",
  "improvements": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}

Respond ONLY with valid JSON. No additional text.`;

  return basePrompt;
}
