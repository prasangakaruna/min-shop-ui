export const CATEGORY_LABELS: Record<string, string> = {
  animals_pet_supplies: 'Animals & Pet Supplies',
  apparel_accessories: 'Apparel & Accessories',
  arts_entertainment: 'Arts & Entertainment',
  baby_toddler: 'Baby & Toddler',
  business_industrial: 'Business & Industrial',
  cameras_optics: 'Cameras & Optics',
  electronics: 'Electronics',
  food_beverages_tobacco: 'Food, Beverages & Tobacco',
  furniture: 'Furniture',
  hardware: 'Hardware',
  health_beauty: 'Health & Beauty',
  home_garden: 'Home & Garden',
  luggage_bags: 'Luggage & Bags',
  mature: 'Mature',
  media: 'Media',
  office_supplies: 'Office Supplies',
  religious_ceremonial: 'Religious & Ceremonial',
  software: 'Software',
  sporting_goods: 'Sporting Goods',
  toys_games: 'Toys & Games',
  vehicles_parts: 'Vehicles & Parts',
  gift_cards: 'Gift Cards',
  uncategorized: 'Uncategorized',
  services: 'Services',
  product_add_ons: 'Product Add-Ons',
  bundles: 'Bundles',
};

/** Normalize category id for comparisons (slug or display name). */
function normalizeCategoryId(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Gift cards are products but should not appear as a browse “category” on the public storefront
 * (sidebar / home category tiles). They remain reachable via search, direct links, and admin.
 */
export function isCategoryHiddenFromStorefrontBrowse(raw: string | null | undefined): boolean {
  if (!raw || !raw.trim()) return false;
  return normalizeCategoryId(raw) === 'gift_cards';
}

export function formatCategoryLabel(raw: string | null | undefined): string {
  if (!raw) return 'Other';
  const normalized = raw.trim();
  if (!normalized) return 'Other';
  if (CATEGORY_LABELS[normalized]) return CATEGORY_LABELS[normalized];
  // Fallback: convert slug/identifier to Title Case
  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

