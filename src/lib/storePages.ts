/** Max width of the page column on the storefront (main + preview). */
export type CmsPageLayoutWidth = 'narrow' | 'default' | 'wide' | 'full';

export const CMS_PAGE_LAYOUT_OPTIONS: { value: CmsPageLayoutWidth; label: string }[] = [
  { value: 'narrow', label: 'Narrow (~36rem)' },
  { value: 'default', label: 'Default (~48rem)' },
  { value: 'wide', label: 'Wide (~64rem)' },
  { value: 'full', label: 'Full (~96rem)' },
];

export function normalizeCmsPageLayoutWidth(v: string | null | undefined): CmsPageLayoutWidth {
  if (v === 'narrow' || v === 'wide' || v === 'full') {
    return v;
  }
  return 'default';
}

export function cmsPageMainMaxWidthClass(layout: string | null | undefined): string {
  const l = normalizeCmsPageLayoutWidth(layout);
  switch (l) {
    case 'narrow':
      return 'max-w-xl';
    case 'wide':
      return 'max-w-5xl';
    case 'full':
      return 'max-w-[min(100%,96rem)]';
    case 'default':
    default:
      return 'max-w-3xl';
  }
}

export type StoreContentPage = {
  id: string;
  title: string;
  handle: string;
  body: string | null;
  excerpt: string | null;
  featured_image: string | null;
  layout_width?: CmsPageLayoutWidth | string | null;
  parent_id: string | null;
  published: boolean;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
};

/** URL segment: lowercase letters, numbers, hyphens; must start with alphanumeric. */
export function slugifyPageHandle(title: string): string {
  const s = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!s) return '';
  if (/^[a-z0-9]/.test(s)) return s;
  return `p-${s.replace(/^[^a-z0-9]+/, '')}` || 'page';
}
