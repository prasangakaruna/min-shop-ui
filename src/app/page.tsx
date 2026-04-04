import { headers } from 'next/headers';
import { StorefrontProvider } from '@/context/StorefrontContext';
import StorefrontHomeBody from '@/components/StorefrontHomeBody';
import { storeSlugFromHost } from '@/lib/storeSlug';

async function resolveSearchParams(
  searchParams: Promise<{ store?: string | string[] }> | undefined,
): Promise<{ store?: string | string[] }> {
  if (searchParams == null) {
    return {};
  }
  return searchParams;
}

async function storeSlugFromRequestHost(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-host');
  const hostHeader = h.get('host');
  const host = (forwarded ?? hostHeader ?? '')
    .split(',')[0]
    .trim()
    .split(':')[0]
    .toLowerCase();
  if (!host) return null;
  return storeSlugFromHost(host);
}

/**
 * `/` = global Mint marketplace (default logo/colors) unless you pass a store slug:
 * - `/?store=your-store-slug` — preview that store’s theme + logo on localhost
 * - Production: `https://{slug}.mint-shop.pro` (subdomain = store slug, resolved from Host on the server)
 */
export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ store?: string | string[] }>;
}) {
  const sp = await resolveSearchParams(searchParams);
  const raw = sp?.store;
  const fromQuery = Array.isArray(raw) ? raw[0] : raw ?? null;
  const q = typeof fromQuery === 'string' && fromQuery.trim() !== '' ? fromQuery.trim() : null;
  const fromHost = await storeSlugFromRequestHost();
  const storeSlug = q ?? fromHost;

  return (
    <StorefrontProvider storeSlug={storeSlug}>
      <StorefrontHomeBody storeSlug={storeSlug} />
    </StorefrontProvider>
  );
}
