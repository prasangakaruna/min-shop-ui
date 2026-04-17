import { headers } from 'next/headers';
import { publicHostnameForStorefrontSlug, storeSlugFromHost } from '@/lib/storeSlug';

function firstStoreParam(store: string | string[] | undefined): string | null {
  const raw = Array.isArray(store) ? store[0] : store ?? null;
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : null;
}

/**
 * Server-only: tenant slug from `?store=` or subdomain of the public marketplace root.
 * Used for marketplace vs storefront context on the public site.
 */
export async function resolveMarketplaceStoreSlugFromRequest(searchParams?: {
  store?: string | string[];
} | null): Promise<string | null> {
  const q = firstStoreParam(searchParams?.store);
  if (q) return q;
  const h = await headers();
  const host = publicHostnameForStorefrontSlug(h.get('host'), h.get('x-forwarded-host'));
  if (!host) return null;
  return storeSlugFromHost(host);
}
