'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  apiRequest,
  getStoreNavigationOptions,
  type NavigationCollectionOption,
  type NavigationPageOption,
  type Product,
  type ProductsResponse,
} from '@/lib/api';

type BlogPost = { id: string; title: string };

type StackFrame =
  | { screen: 'root' }
  | { screen: 'collections' }
  | { screen: 'products' }
  | { screen: 'pages' }
  | { screen: 'blogs' }
  | { screen: 'blog-posts' }
  | { screen: 'policies' }
  | { screen: 'customer' };

function withStoreQuery(path: string, storeSlug: string | null | undefined): string {
  if (!storeSlug) return path;
  const [beforeHash, hash] = path.split('#');
  const sep = beforeHash.includes('?') ? '&' : '?';
  const next = `${beforeHash}${sep}store=${encodeURIComponent(storeSlug)}`;
  return hash ? `${next}#${hash}` : next;
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconTag({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function IconDoc({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconPen({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function IconBag({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function summarizeMenuLinkUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed === '/') return 'Home page';
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://local';
    const u = trimmed.startsWith('http') ? new URL(trimmed) : new URL(trimmed, base);
    const path = u.pathname || '/';
    const cat = u.searchParams.get('category');
    const search = u.searchParams.get('search');
    if (path === '/search') return 'Search';
    if (path === '/products' && cat) return `Collection · ${cat}`;
    if (path === '/products' && search) return `Search · ${search}`;
    if (path === '/products') return 'Products';
    const pm = path.match(/^\/product\/(\d+)/);
    if (pm) return `Product · #${pm[1]}`;
    const pg = path.match(/^\/pages\/([^/?#]+)/);
    if (pg) return `Page · ${decodeURIComponent(pg[1])}`;
    if (path === '/profile/orders') return 'Orders';
    if (path === '/profile/settings' || path === '/dashboard') return 'Account';
    if (path.startsWith('/profile')) return 'Customer account';
    return trimmed.length > 42 ? `${trimmed.slice(0, 40)}…` : trimmed;
  } catch {
    return trimmed.length > 42 ? `${trimmed.slice(0, 40)}…` : trimmed;
  }
}

type MenuLinkPickerProps = {
  value: string;
  /** Optional friendly label chosen from the picker (not persisted separately). */
  displayOverride?: string;
  onChange: (url: string, options?: { display?: string }) => void;
  token: string | null;
  storeId: number | null;
  storeSlug: string | null | undefined;
  disabled?: boolean;
};

export default function MenuLinkPicker({
  value,
  displayOverride,
  onChange,
  token,
  storeId,
  storeSlug,
  disabled,
}: MenuLinkPickerProps) {
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState<StackFrame[]>([{ screen: 'root' }]);
  const [filter, setFilter] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [debouncedProductQuery, setDebouncedProductQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [dbPages, setDbPages] = useState<NavigationPageOption[]>([]);
  const [dbCollections, setDbCollections] = useState<NavigationCollectionOption[]>([]);
  const [navLoading, setNavLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 320 });

  const top = stack[stack.length - 1];

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedProductQuery(productQuery), 280);
    return () => window.clearTimeout(t);
  }, [productQuery]);

  const loadProducts = useCallback(
    async (search?: string) => {
      if (!token || !storeId) return;
      setProductsLoading(true);
      try {
        const res = await apiRequest<ProductsResponse>('/store/products', {
          token,
          storeId,
          query: { per_page: 100, ...(search?.trim() ? { search: search.trim() } : {}) },
        });
        setProducts((res.data ?? []) as Product[]);
      } catch {
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    },
    [token, storeId]
  );

  useEffect(() => {
    if (!open || !token || !storeId) return;
    setNavLoading(true);
    getStoreNavigationOptions({ token, storeId })
      .then((res) => {
        setDbPages(Array.isArray(res.pages) ? res.pages : []);
        setDbCollections(Array.isArray(res.collections) ? res.collections : []);
      })
      .catch(() => {
        setDbPages([]);
        setDbCollections([]);
      })
      .finally(() => setNavLoading(false));
  }, [open, token, storeId]);

  useEffect(() => {
    if (!open || !token || !storeId) return;
    if (top.screen === 'products') {
      void loadProducts(debouncedProductQuery);
    }
  }, [open, token, storeId, top.screen, debouncedProductQuery, loadProducts]);

  useEffect(() => {
    if (!open || !token || !storeId) return;
    if (top.screen !== 'blog-posts') return;
    setBlogsLoading(true);
    apiRequest<{ data: { blog_posts?: BlogPost[] } }>('/store/content', { token, storeId })
      .then((r) => setBlogPosts(Array.isArray(r.data?.blog_posts) ? r.data.blog_posts : []))
      .catch(() => setBlogPosts([]))
      .finally(() => setBlogsLoading(false));
  }, [open, token, storeId, top.screen]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const el = triggerRef.current;
    const rect = el.getBoundingClientRect();
    const width = Math.min(420, Math.max(320, rect.width));
    let left = rect.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    setCoords({ top: rect.bottom + 6, left, width });
  }, [open]);

  const select = useCallback(
    (path: string, display: string) => {
      const full = path.startsWith('http') ? path : withStoreQuery(path, storeSlug);
      onChange(full, { display });
      setOpen(false);
      setStack([{ screen: 'root' }]);
      setFilter('');
      setProductQuery('');
    },
    [onChange, storeSlug]
  );

  const filteredDbCollections = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return dbCollections;
    return dbCollections.filter((c) => c.name.toLowerCase().includes(q));
  }, [dbCollections, filter]);

  const filteredDbPages = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return dbPages;
    return dbPages.filter((p) => `${p.title} ${p.handle}`.toLowerCase().includes(q));
  }, [dbPages, filter]);

  const policyPagesFromDb = useMemo(
    () =>
      dbPages.filter((p) =>
        /privacy|terms|polic|refund|legal|shipping|cookie|access/i.test(`${p.handle} ${p.title}`)
      ),
    [dbPages]
  );

  const rootRows = useMemo(
    () =>
      [
        { key: 'home', label: 'Home page', icon: IconHome, hasChild: false, onPick: () => select('/', 'Home page') },
        { key: 'search', label: 'Search', icon: IconSearch, hasChild: false, onPick: () => select('/search', 'Search') },
        {
          key: 'collections',
          label: 'Collections',
          icon: IconTag,
          hasChild: true,
          onPick: () => {
            setFilter('');
            setStack((s) => [...s, { screen: 'collections' }]);
          },
        },
        {
          key: 'products',
          label: 'Products',
          icon: IconTag,
          hasChild: true,
          onPick: () => {
            setFilter('');
            setProductQuery('');
            setStack((s) => [...s, { screen: 'products' }]);
          },
        },
        {
          key: 'pages',
          label: 'Pages',
          icon: IconDoc,
          hasChild: true,
          onPick: () => {
            setFilter('');
            setStack((s) => [...s, { screen: 'pages' }]);
          },
        },
        {
          key: 'blogs',
          label: 'Blogs',
          icon: IconPen,
          hasChild: true,
          onPick: () => {
            setFilter('');
            setStack((s) => [...s, { screen: 'blogs' }]);
          },
        },
        {
          key: 'blog-posts',
          label: 'Blog posts',
          icon: IconPen,
          hasChild: true,
          onPick: () => {
            setFilter('');
            setStack((s) => [...s, { screen: 'blog-posts' }]);
          },
        },
        {
          key: 'policies',
          label: 'Policies',
          icon: IconDoc,
          hasChild: true,
          onPick: () => {
            setFilter('');
            setStack((s) => [...s, { screen: 'policies' }]);
          },
        },
      ] as const,
    [select]
  );

  const filteredRootRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rootRows;
    return rootRows.filter((r) => r.label.toLowerCase().includes(q));
  }, [rootRows, filter]);

  const goBack = () => {
    setStack((s) => (s.length <= 1 ? s : s.slice(0, -1)));
    setFilter('');
  };

  const showTriggerLabel = displayOverride?.trim() || summarizeMenuLinkUrl(value);

  const panel = open && typeof document !== 'undefined' && (
    <div
      ref={panelRef}
      className="fixed z-[200] max-h-[min(70vh,520px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
      style={{ top: coords.top, left: coords.left, width: coords.width }}
      role="listbox"
    >
      <div className="flex max-h-[inherit] flex-col">
        {stack.length > 1 && (
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <button
              type="button"
              onClick={goBack}
              className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
              aria-label="Back"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-800">
              {top.screen === 'customer' ? 'Customer accounts' : 'Online store'}
            </span>
          </div>
        )}

        {top.screen === 'root' && (
          <>
            <div className="border-b border-gray-100 p-2">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search link targets…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div className="overflow-y-auto overscroll-contain p-1">
              <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Online store</p>
              {filteredRootRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => row.onPick()}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-gray-500" />
                      <span className="flex-1">{row.label}</span>
                      {row.hasChild ? <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" /> : null}
                    </button>
                  );
                })}
              <p className="mt-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Customer accounts</p>
              <button
                type="button"
                onClick={() => setStack((s) => [...s, { screen: 'customer' }])}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50"
              >
                <IconBag className="h-5 w-5 shrink-0 text-gray-500" />
                <span className="flex-1">Orders &amp; account</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              </button>
              <div className="mt-2 border-t border-gray-100 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Custom link</p>
                <div className="mt-2 flex gap-2">
                  <input
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="/path or https://…"
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customUrl.trim()) {
                        select(customUrl.trim(), customUrl.trim());
                        setCustomUrl('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!customUrl.trim()}
                    onClick={() => {
                      if (!customUrl.trim()) return;
                      select(customUrl.trim(), customUrl.trim());
                      setCustomUrl('');
                    }}
                    className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {top.screen === 'collections' && (
          <div className="overflow-y-auto overscroll-contain p-1">
            <div className="border-b border-gray-100 p-2">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter collections…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            {navLoading ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">Loading from database…</p>
            ) : filteredDbCollections.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">
                No collections yet. Assign categories or collection names on products.
              </p>
            ) : (
              filteredDbCollections.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => select(c.url, `Collection · ${c.name}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50"
                >
                  <IconTag className="h-5 w-5 text-gray-500" />
                  <span>{c.name}</span>
                </button>
              ))
            )}
          </div>
        )}

        {top.screen === 'products' && (
          <div className="flex max-h-[min(60vh,440px)] flex-col">
            <div className="border-b border-gray-100 p-2">
              <input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="overflow-y-auto overscroll-contain p-1">
              {productsLoading ? (
                <p className="px-3 py-6 text-center text-sm text-gray-500">Loading…</p>
              ) : products.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-gray-500">No products match.</p>
              ) : (
                products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => select(`/product/${p.id}`, `Product · ${p.title}`)}
                    className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">{p.title}</span>
                    {p.category ? <span className="text-xs text-gray-500">{p.category}</span> : null}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {top.screen === 'pages' && (
          <div className="overflow-y-auto overscroll-contain p-1">
            <div className="border-b border-gray-100 p-2">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter pages…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Store pages (database)</p>
            {navLoading ? (
              <p className="px-3 py-4 text-center text-sm text-gray-500">Loading pages…</p>
            ) : filteredDbPages.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500">No pages in database.</p>
            ) : (
              filteredDbPages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => select(p.url, `Page · ${p.title}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50"
                >
                  <IconDoc className="h-5 w-5 text-gray-500" />
                  <span>{p.title}</span>
                </button>
              ))
            )}
            <p className="mt-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Storefront</p>
            {[
              { label: 'All products', path: '/products', display: 'Products' },
              { label: 'Cart', path: '/cart', display: 'Cart' },
              { label: 'Checkout', path: '/checkout/payment', display: 'Checkout' },
            ].map((row) => (
              <button
                key={row.path}
                type="button"
                onClick={() => select(row.path, row.display)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50"
              >
                <IconDoc className="h-5 w-5 text-gray-500" />
                {row.label}
              </button>
            ))}
          </div>
        )}

        {top.screen === 'blogs' && (
          <div className="overflow-y-auto overscroll-contain p-1">
            <button
              type="button"
              onClick={() => select('/products', 'Blog')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50"
            >
              <IconPen className="h-5 w-5 text-gray-500" />
              Blog (products listing)
            </button>
            <p className="px-3 py-2 text-xs text-gray-500">Add a dedicated blog route later to deep-link posts.</p>
          </div>
        )}

        {top.screen === 'blog-posts' && (
          <div className="overflow-y-auto overscroll-contain p-1">
            {blogsLoading ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">Loading…</p>
            ) : blogPosts.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">No blog posts in Content yet.</p>
            ) : (
              blogPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() =>
                    select(`/products?search=${encodeURIComponent(post.title)}`, `Blog post · ${post.title}`)
                  }
                  className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{post.title}</span>
                </button>
              ))
            )}
          </div>
        )}

        {top.screen === 'policies' && (
          <div className="overflow-y-auto overscroll-contain p-1">
            {navLoading ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">Loading…</p>
            ) : null}
            {policyPagesFromDb.length > 0 ? (
              <>
                <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">From database</p>
                {policyPagesFromDb.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => select(p.url, `Page · ${p.title}`)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50"
                  >
                    <IconDoc className="h-5 w-5 text-gray-500" />
                    {p.title}
                  </button>
                ))}
              </>
            ) : null}
            <p className="mt-1 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Shortcuts</p>
            {[
              { label: 'Privacy policy', path: '/#privacy', display: 'Privacy policy' },
              { label: 'Terms of service', path: '/#terms', display: 'Terms of service' },
              { label: 'Refund policy', path: '/#refund', display: 'Refund policy' },
            ].map((row) => (
              <button
                key={row.label}
                type="button"
                onClick={() => select(row.path, row.display)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50"
              >
                <IconDoc className="h-5 w-5 text-gray-500" />
                {row.label}
              </button>
            ))}
          </div>
        )}

        {top.screen === 'customer' && (
          <div className="overflow-y-auto overscroll-contain p-1">
            <button
              type="button"
              onClick={() => select('/profile/orders', 'Orders')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50"
            >
              <IconBag className="h-5 w-5 text-gray-500" />
              Orders
            </button>
            <button
              type="button"
              onClick={() => select('/profile/settings', 'Account')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50"
            >
              <IconUser className="h-5 w-5 text-gray-500" />
              Profile &amp; settings
            </button>
            <button
              type="button"
              onClick={() => select('/dashboard', 'Account')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-gray-50"
            >
              <IconUser className="h-5 w-5 text-gray-500" />
              Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          if (!open) {
            setStack([{ screen: 'root' }]);
            setFilter('');
            setProductQuery('');
          }
        }}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-800 hover:border-gray-300 disabled:opacity-50"
      >
        <IconHome className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="min-w-0 flex-1 truncate">{showTriggerLabel}</span>
        <ChevronRight className="h-4 w-4 shrink-0 -rotate-90 text-gray-400" />
      </button>
      {panel && createPortal(panel, document.body)}
    </>
  );
}
