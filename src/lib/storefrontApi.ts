/**
 * Public storefront API (no auth). Used for the main marketplace home page.
 */

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';

export interface StorefrontStore {
  id: number;
  name: string;
  slug: string;
  domain?: string | null;
  email?: string | null;
  plan?: string;
  is_active?: boolean;
}

export interface StorefrontProduct {
  id: number;
  store_id: number;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  price: string;
  variants: { id: number; price: string; title: string | null; sku: string | null }[];
  store: { id: number; name: string; slug: string } | null;
}

export interface StorefrontStoresResponse {
  data: StorefrontStore[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface StorefrontProductsResponse {
  data: StorefrontProduct[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export async function storefrontRequest<T>(
  path: string,
  query?: Record<string, string | number | undefined>
): Promise<T> {
  const base = getBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const fullPath = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const url = new URL(fullPath);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || res.statusText);
  return data as T;
}
