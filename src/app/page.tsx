import { StorefrontProvider } from '@/context/StorefrontContext';
import StorefrontHomeBody from '@/components/StorefrontHomeBody';

export default function Home({ searchParams }: { searchParams?: { store?: string | string[] } }) {
  const raw = searchParams?.store;
  const storeSlug = Array.isArray(raw) ? raw[0] : raw ?? null;

  return (
    <StorefrontProvider storeSlug={storeSlug}>
      <StorefrontHomeBody storeSlug={storeSlug} />
    </StorefrontProvider>
  );
}
