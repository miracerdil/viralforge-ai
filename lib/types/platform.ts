// Platform types for multi-platform support
export type Platform = 'tiktok' | 'instagram_reels' | 'instagram_post' | 'youtube_shorts';

export const PLATFORMS: Platform[] = [
  'tiktok',
  'instagram_reels',
  'instagram_post',
  'youtube_shorts',
];

// Platform metadata for UI rendering
export interface PlatformInfo {
  id: Platform;
  labelKey: string; // i18n key
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  bgColor: string; // Background color class
}

export const PLATFORM_INFO: Record<Platform, PlatformInfo> = {
  tiktok: {
    id: 'tiktok',
    labelKey: 'tiktok',
    icon: 'Music2',
    color: 'text-black',
    bgColor: 'bg-black',
  },
  instagram_reels: {
    id: 'instagram_reels',
    labelKey: 'instagramReels',
    icon: 'Film',
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
  instagram_post: {
    id: 'instagram_post',
    labelKey: 'instagramPost',
    icon: 'Image',
    color: 'text-purple-600',
    bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
  youtube_shorts: {
    id: 'youtube_shorts',
    labelKey: 'youtubeShorts',
    icon: 'Youtube',
    color: 'text-red-600',
    bgColor: 'bg-red-600',
  },
};

// Platform-specific content characteristics
export interface PlatformCharacteristics {
  maxDuration: number; // seconds
  optimalDuration: { min: number; max: number };
  hashtagStrategy: {
    niche: number;
    reach: number;
    branded: number;
  };
  captionMaxLength: number;
  supportsThumbnail: boolean;
  supportsCarousel: boolean;
  primaryFocus: string[];
}

export const PLATFORM_CHARACTERISTICS: Record<Platform, PlatformCharacteristics> = {
  tiktok: {
    maxDuration: 180,
    optimalDuration: { min: 15, max: 60 },
    hashtagStrategy: { niche: 3, reach: 2, branded: 0 },
    captionMaxLength: 2200,
    supportsThumbnail: true,
    supportsCarousel: false,
    primaryFocus: ['hook', 'retention', 'on_screen_text', 'fast_pacing'],
  },
  instagram_reels: {
    maxDuration: 90,
    optimalDuration: { min: 15, max: 30 },
    hashtagStrategy: { niche: 5, reach: 5, branded: 3 },
    captionMaxLength: 2200,
    supportsThumbnail: true,
    supportsCarousel: false,
    primaryFocus: ['caption', 'cover_text', 'hashtags', 'cta'],
  },
  instagram_post: {
    maxDuration: 0, // Not video-based
    optimalDuration: { min: 0, max: 0 },
    hashtagStrategy: { niche: 10, reach: 10, branded: 5 },
    captionMaxLength: 2200,
    supportsThumbnail: false,
    supportsCarousel: true,
    primaryFocus: ['caption_long_form', 'first_line_hook', 'carousel_slides', 'posting_time'],
  },
  youtube_shorts: {
    maxDuration: 60,
    optimalDuration: { min: 30, max: 60 },
    hashtagStrategy: { niche: 3, reach: 0, branded: 0 },
    captionMaxLength: 100,
    supportsThumbnail: true,
    supportsCarousel: false,
    primaryFocus: ['title', 'retention_curve', 'subscribe_cta', 'keywords'],
  },
};

// Default platform
export const DEFAULT_PLATFORM: Platform = 'tiktok';
