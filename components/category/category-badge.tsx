'use client';

import { User, Building2 } from 'lucide-react';
import type { CategoryGroupId } from '@/lib/types/category';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface CategoryBadgeProps {
  group: CategoryGroupId;
  slug: string;
  locale: string;
  dictionary: Dictionary;
  size?: 'sm' | 'md';
}

export function CategoryBadge({
  group,
  slug,
  locale,
  dictionary,
  size = 'sm',
}: CategoryBadgeProps) {
  const t = dictionary.categories;

  const groupLabel = t.groups[group];
  const groupLabels = t[group as keyof typeof t] as Record<string, string> | undefined;
  const categoryLabel =
    groupLabels && typeof groupLabels === 'object' && slug in groupLabels
      ? groupLabels[slug]
      : slug;

  const isSmall = size === 'sm';

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ${
          group === 'creator'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-purple-100 text-purple-700'
        } ${isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}
      >
        {group === 'creator' ? (
          <User className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
        ) : (
          <Building2 className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
        )}
        {groupLabel}
      </span>
      <span
        className={`inline-flex items-center rounded-full bg-gray-100 text-gray-700 font-medium ${
          isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        }`}
      >
        {categoryLabel}
      </span>
    </div>
  );
}
