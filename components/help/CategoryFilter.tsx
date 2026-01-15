'use client';

import * as Icons from 'lucide-react';

interface Category {
  id: string;
  name_tr: string;
  name_en: string;
  icon: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  locale: string;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  locale,
}: CategoryFilterProps) {
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.HelpCircle;
    return Icon;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* All button */}
      <button
        onClick={() => onSelectCategory(null)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          selectedCategory === null
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Icons.LayoutGrid className="w-4 h-4" />
        {locale === 'tr' ? 'Tümü' : 'All'}
      </button>

      {/* Category buttons */}
      {categories.map((category) => {
        const Icon = getIcon(category.icon);
        const isSelected = selectedCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {locale === 'tr' ? category.name_tr : category.name_en}
          </button>
        );
      })}
    </div>
  );
}
