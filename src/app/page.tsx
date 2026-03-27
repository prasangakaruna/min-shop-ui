import { StorefrontProvider } from '@/context/StorefrontContext';
import StorefrontHomeBody from '@/components/StorefrontHomeBody';

type SearchParamsInput = { store?: string | string[] } | Promise<{ store?: string | string[] }> | undefined;

async function resolveSearchParams(searchParams: SearchParamsInput): Promise<{ store?: string | string[] }> {
  if (searchParams == null) {
    return {};
  }
  return searchParams instanceof Promise ? await searchParams : searchParams;
}

/**
 * `/` = global Mint marketplace (default logo/colors) unless you pass a store slug:
 * - `/?store=your-store-slug` — preview that store’s theme + logo on localhost
 * - Production: `https://{slug}.mint-shop.pro` (subdomain = store slug)
 */
export default async function Home({ searchParams }: { searchParams?: SearchParamsInput }) {
  const sp = await resolveSearchParams(searchParams);
  const raw = sp?.store;
  const storeSlug = Array.isArray(raw) ? raw[0] : raw ?? null;

  return (
    <StorefrontProvider storeSlug={storeSlug}>
      <StorefrontHomeBody storeSlug={storeSlug} />
    </StorefrontProvider>
  );
}
