/** WordPress-like page workflow */
export type CmsPageStatus = 'draft' | 'pending' | 'published' | 'scheduled' | 'private';

export const CMS_PAGE_STATUS_OPTIONS: { value: CmsPageStatus; label: string; hint: string }[] = [
  { value: 'draft', label: 'Draft', hint: 'Only visible in admin preview until you publish.' },
  { value: 'pending', label: 'Pending review', hint: 'Awaiting review before publishing.' },
  { value: 'published', label: 'Published', hint: 'Visible on the storefront to everyone.' },
  { value: 'scheduled', label: 'Scheduled', hint: 'Goes live automatically at the date and time you set.' },
  {
    value: 'private',
    label: 'Private',
    hint: 'Hidden from the public site; store staff can open it when signed in with the same account that manages the store.',
  },
];

export function normalizeCmsPageStatus(v: string | null | undefined, publishedFallback: boolean): CmsPageStatus {
  if (v === 'draft' || v === 'pending' || v === 'published' || v === 'scheduled' || v === 'private') {
    return v;
  }
  return publishedFallback ? 'published' : 'draft';
}

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

/** WordPress-style meta rows (plain text; sanitized on the API). */
export type CmsPageCustomField = { name: string; value: string };

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
  status?: CmsPageStatus | string | null;
  published_at?: string | null;
  custom_fields?: CmsPageCustomField[];
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export function normalizeCustomFields(raw: CmsPageCustomField[] | null | undefined): CmsPageCustomField[] {
  if (!raw || !Array.isArray(raw)) return [{ name: '', value: '' }];
  const rows = raw.map((r) => ({ name: String(r.name ?? ''), value: String(r.value ?? '') }));
  return rows.length > 0 ? rows : [{ name: '', value: '' }];
}

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
