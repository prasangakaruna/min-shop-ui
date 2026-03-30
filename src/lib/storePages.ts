export type StoreContentPage = {
  id: string;
  title: string;
  handle: string;
  body: string | null;
  excerpt: string | null;
  featured_image: string | null;
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
