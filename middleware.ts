import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { storeSlugFromHost } from '@/lib/storeSlug';

export function middleware(req: NextRequest) {
  if (req.method !== 'GET') return NextResponse.next();

  const hostHeader = req.headers.get('host');
  const hostname = hostHeader?.split(':')[0] ?? '';
  const storeSlug = storeSlugFromHost(hostname);
  if (!storeSlug) return NextResponse.next();

  const { pathname, searchParams } = req.nextUrl;
  const hasStoreParam = searchParams.has('store') && (searchParams.get('store') ?? '').trim() !== '';
  if (hasStoreParam) return NextResponse.next();

  // Storefront routes that depend on `?store=...`
  const needsStore = pathname === '/' || pathname === '/products';
  if (!needsStore) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.searchParams.set('store', storeSlug);
  // Rewrite so the user-friendly URL stays clean.
  return NextResponse.rewrite(url);
}

