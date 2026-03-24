import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getStoreSlugFromHost(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const hostname = hostHeader.split(':')[0]?.toLowerCase() ?? '';
  if (!hostname) return null;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null;

  const parts = hostname.split('.').filter(Boolean);
  if (parts.length < 2) return null;

  // Handle www.<store>.<root>
  const effectiveParts = parts[0] === 'www' && parts.length >= 3 ? parts.slice(1) : parts;
  const storeSlug = effectiveParts[0];
  return storeSlug && storeSlug !== 'localhost' ? storeSlug : null;
}

export function middleware(req: NextRequest) {
  if (req.method !== 'GET') return NextResponse.next();

  const storeSlug = getStoreSlugFromHost(req.headers.get('host'));
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

