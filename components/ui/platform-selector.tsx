'use client';

import { Music2, Film, Image, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Platform } from '@/lib/types/platform';
import { PLATFORMS } from '@/lib/types/platform';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface PlatformSelectorProps {
  value: Platform;
  onChange: (platform: Platform) => void;
  dictionary: Dictionary;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'segmented' | 'dropdown' | 'cards';
}

const platformIcons: Record<Platform, React.ReactNode> = {
  tiktok: <Music2 className="w-4 h-4" />,
  instagram_reels: <Film className="w-4 h-4" />,
  instagram_post: <Image className="w-4 h-4" />,
  youtube_shorts: <Youtube className="w-4 h-4" />,
};

const platformColors: Record<Platform, { bg: string; text: string; border: string }> = {
  tiktok: {
    bg: 'bg-black',
    text: 'text-white',
    border: 'border-black',
  },
  instagram_reels: {
    bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    text: 'text-white',
    border: 'border-pink-500',
  },
  instagram_post: {
    bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    text: 'text-white',
    border: 'border-purple-500',
  },
  youtube_shorts: {
    bg: 'bg-red-600',
    text: 'text-white',
    border: 'border-red-600',
  },
};

export function PlatformSelector({
  value,
  onChange,
  dictionary,
  disabled = false,
  size = 'md',
  variant = 'segmented',
}: PlatformSelectorProps) {
  const t = dictionary.platforms;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const labels: Record<Platform, string> = {
    tiktok: t.tiktok,
    instagram_reels: t.instagramReels,
    instagram_post: t.instagramPost,
    youtube_shorts: t.youtubeShorts,
  };

  if (variant === 'segmented') {
    return (
      <div className="w-full min-w-0">
        {/* Mobile: horizontal scroll, Desktop: wrap */}
        <div className="overflow-x-auto md:overflow-visible scrollbar-hide">
          <div className="inline-flex md:flex md:flex-wrap rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
            {PLATFORMS.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => !disabled && onChange(platform)}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-2 rounded-md transition-all shrink-0 md:shrink',
                  sizeClasses[size],
                  value === platform
                    ? cn(platformColors[platform].bg, platformColors[platform].text, 'shadow-sm')
                    : 'text-gray-600 hover:bg-gray-100',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {platformIcons[platform]}
                <span className="hidden sm:inline">{labels[platform]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PLATFORMS.map((platform) => (
          <button
            key={platform}
            type="button"
            onClick={() => !disabled && onChange(platform)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
              value === platform
                ? cn(platformColors[platform].border, 'bg-gray-50')
                : 'border-gray-200 hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full',
                platformColors[platform].bg,
                platformColors[platform].text
              )}
            >
              {platformIcons[platform]}
            </div>
            <span className="text-sm font-medium text-gray-900">{labels[platform]}</span>
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Platform)}
      disabled={disabled}
      className={cn(
        'block w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-primary-500 focus:ring-primary-500',
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {PLATFORMS.map((platform) => (
        <option key={platform} value={platform}>
          {labels[platform]}
        </option>
      ))}
    </select>
  );
}

// Badge component for displaying platform in lists
export function PlatformBadge({
  platform,
  dictionary,
  size = 'sm',
}: {
  platform: Platform;
  dictionary: Dictionary;
  size?: 'sm' | 'md';
}) {
  const t = dictionary.platforms;
  const labels: Record<Platform, string> = {
    tiktok: t.tiktok,
    instagram_reels: t.instagramReels,
    instagram_post: t.instagramPost,
    youtube_shorts: t.youtubeShorts,
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        platformColors[platform].bg,
        platformColors[platform].text,
        sizeClasses[size]
      )}
    >
      {platformIcons[platform]}
      {labels[platform]}
    </span>
  );
}
