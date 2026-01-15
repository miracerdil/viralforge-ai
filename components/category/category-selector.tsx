'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Building2, ChevronDown, Check } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { CategoryGroupId, Category, CategorySelection } from '@/lib/types/category';

interface CategorySelectorProps {
  locale: string;
  dictionary: Dictionary;
  value: CategorySelection;
  onChange: (selection: CategorySelection) => void;
  categories: Category[];
  disabled?: boolean;
  compact?: boolean; // For filter usage
}

export function CategorySelector({
  locale,
  dictionary,
  value,
  onChange,
  categories,
  disabled = false,
  compact = false,
}: CategorySelectorProps) {
  const t = dictionary.categories;

  const filteredCategories = categories.filter((cat) => cat.group_id === value.group);

  // Ensure the current slug exists in filtered categories, otherwise use first available
  const effectiveSlug = filteredCategories.some((cat) => cat.slug === value.slug)
    ? value.slug
    : filteredCategories[0]?.slug || value.slug;

  // Store onChange in a ref to avoid re-running effect when callback identity changes
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync slug if it doesn't match (edge case when group changes but slug is stale)
  useEffect(() => {
    if (effectiveSlug !== value.slug && filteredCategories.length > 0) {
      onChangeRef.current({ ...value, slug: effectiveSlug });
    }
  }, [effectiveSlug, value, filteredCategories.length]);

  const handleGroupChange = (group: CategoryGroupId) => {
    // When group changes, select first category of that group
    const firstCategory = categories.find((cat) => cat.group_id === group);
    onChange({
      group,
      slug: firstCategory?.slug || (group === 'creator' ? 'lifestyle' : 'cafe_restaurant'),
    });
  };

  const handleCategoryChange = (slug: string) => {
    onChange({ ...value, slug });
  };

  const getCategoryLabel = (cat: Category) => {
    return locale === 'tr' ? cat.label_tr : cat.label_en;
  };

  // Get selected category label from dictionary
  const getLocalizedCategoryLabel = (group: CategoryGroupId, slug: string) => {
    const groupLabels = t[group as keyof typeof t] as Record<string, string> | undefined;
    if (groupLabels && typeof groupLabels === 'object' && slug in groupLabels) {
      return groupLabels[slug];
    }
    // Fallback to category data
    const cat = categories.find((c) => c.slug === slug);
    return cat ? getCategoryLabel(cat) : slug;
  };

  // Get current selected label for display
  const selectedLabel = getLocalizedCategoryLabel(value.group, effectiveSlug);

  // Custom dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (compact) {
    return (
      <div className="w-full min-w-0 relative" ref={dropdownRef}>
        {/* Row with Group Toggle + Category Button */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Group Toggle */}
          <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 shrink-0">
            <button
              type="button"
              onClick={() => handleGroupChange('creator')}
              disabled={disabled}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                value.group === 'creator'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.groups.creator}
            </button>
            <button
              type="button"
              onClick={() => handleGroupChange('business')}
              disabled={disabled}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                value.group === 'business'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.groups.business}
            </button>
          </div>

          {/* Category Button (trigger) */}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-left focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer flex items-center justify-between"
          >
            <span className="text-gray-900 truncate">{selectedLabel}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown Menu - opens below the entire row */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredCategories.map((cat) => {
              const label = getLocalizedCategoryLabel(value.group, cat.slug);
              const isSelected = cat.slug === effectiveSlug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => {
                    handleCategoryChange(cat.slug);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                    isSelected ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                  }`}
                >
                  <span>{label}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Group Selection */}
      <div className="min-w-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.selectGroup}</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleGroupChange('creator')}
            disabled={disabled}
            className={`p-4 rounded-xl border-2 transition-all ${
              value.group === 'creator'
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  value.group === 'creator' ? 'bg-primary-100' : 'bg-gray-100'
                }`}
              >
                <User
                  className={`w-6 h-6 ${
                    value.group === 'creator' ? 'text-primary-600' : 'text-gray-500'
                  }`}
                />
              </div>
              <div>
                <p
                  className={`font-semibold ${
                    value.group === 'creator' ? 'text-primary-700' : 'text-gray-900'
                  }`}
                >
                  {t.groups.creator}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{t.groupDescriptions.creator}</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleGroupChange('business')}
            disabled={disabled}
            className={`p-4 rounded-xl border-2 transition-all ${
              value.group === 'business'
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  value.group === 'business' ? 'bg-primary-100' : 'bg-gray-100'
                }`}
              >
                <Building2
                  className={`w-6 h-6 ${
                    value.group === 'business' ? 'text-primary-600' : 'text-gray-500'
                  }`}
                />
              </div>
              <div>
                <p
                  className={`font-semibold ${
                    value.group === 'business' ? 'text-primary-700' : 'text-gray-900'
                  }`}
                >
                  {t.groups.business}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{t.groupDescriptions.business}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.selectCategory}</label>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl bg-white text-base text-left focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer flex items-center justify-between"
          >
            <span className="text-gray-900">{selectedLabel}</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
              {filteredCategories.map((cat) => {
                const label = getLocalizedCategoryLabel(value.group, cat.slug);
                const isSelected = cat.slug === effectiveSlug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      handleCategoryChange(cat.slug);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-base text-left flex items-center justify-between hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl ${
                      isSelected ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && <Check className="w-5 h-5 text-primary-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
