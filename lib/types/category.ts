// Category System V2 Types

export type CategoryGroupId = 'creator' | 'business';

export interface CategoryGroup {
  id: CategoryGroupId;
  label_tr: string;
  label_en: string;
  sort_order: number;
}

export interface Category {
  id: string;
  group_id: CategoryGroupId;
  slug: string;
  label_tr: string;
  label_en: string;
  description_tr: string | null;
  description_en: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface CategorySelection {
  group: CategoryGroupId;
  slug: string;
}

// API Response types
export interface CategoriesResponse {
  groups: CategoryGroup[];
  categories: Category[];
}

// Helper to get localized label
export function getCategoryLabel(category: Category, locale: string): string {
  return locale === 'tr' ? category.label_tr : category.label_en;
}

export function getCategoryDescription(category: Category, locale: string): string | null {
  return locale === 'tr' ? category.description_tr : category.description_en;
}

export function getGroupLabel(group: CategoryGroup, locale: string): string {
  return locale === 'tr' ? group.label_tr : group.label_en;
}

// Default category selection
export const DEFAULT_CATEGORY: CategorySelection = {
  group: 'creator',
  slug: 'lifestyle',
};

// Category group icons (for UI)
export const CATEGORY_GROUP_ICONS: Record<CategoryGroupId, string> = {
  creator: 'User',
  business: 'Building2',
};

// Static category slugs for type safety
export const CREATOR_CATEGORIES = [
  'fitness',
  'beauty',
  'education',
  'motivation',
  'gaming',
  'lifestyle',
  'travel',
  'food',
  'finance',
  'tech',
  'comedy',
  'music',
  'art',
  'fashion',
  'parenting',
] as const;

export const BUSINESS_CATEGORIES = [
  'cafe_restaurant',
  'barber_beauty',
  'gym_studio',
  'clinic_dentist',
  'ecommerce',
  'real_estate',
  'auto_dealer',
  'local_services',
  'education_center',
  'hospitality_hotel',
  'event_venue',
  'corporate_brand',
  'legal_consulting',
  'pet_services',
  'photography',
] as const;

export type CreatorCategorySlug = (typeof CREATOR_CATEGORIES)[number];
export type BusinessCategorySlug = (typeof BUSINESS_CATEGORIES)[number];
export type CategorySlug = CreatorCategorySlug | BusinessCategorySlug;
