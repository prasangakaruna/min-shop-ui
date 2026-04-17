'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ContentRoutesProvider, useContentRoutes } from '@/context/ContentRoutesContext';
import { StoreProvider, useStore } from '@/context/StoreContext';

function navClass(active: boolean) {
  return `rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
    active ? 'bg-mint/15 text-mint-dark ring-1 ring-mint/30' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`;
}

function SystemContentChrome({ children }: { children: React.ReactNode }) {
  const routes = useContentRoutes();
  const pathname = usePathname();
  const { stores, currentStore, setCurrentStore, loading, error } = useStore();

  return (
    <div className="pb-10">
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/system" className="text-sm font-semibold text-mint-dark hover:underline">
              ← Platform overview
            </Link>
            <h1 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">Content</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Full CMS for any tenant: pages, metaobjects, files, menus, and blog posts. Choose a store — the same APIs
              as merchant <code className="rounded bg-gray-100 px-1 text-xs">/admin/content</code>.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:max-w-xs">
            <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400" htmlFor="sys-content-store">
              Store context
            </label>
            <select
              id="sys-content-store"
              disabled={loading || stores.length === 0}
              value={currentStore?.id ?? ''}
              onChange={(e) => {
                const id = e.target.value;
                const next = stores.find((s) => String(s.id) === id) ?? null;
                setCurrentStore(next);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25"
            >
              {stores.length === 0 ? (
                <option value="">{loading ? 'Loading stores…' : 'No stores'}</option>
              ) : (
                stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.slug}){s.is_active ? '' : ' · inactive'}
                  </option>
                ))
              )}
            </select>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>
        </div>

        <nav className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4" aria-label="Content sections">
          <Link href={routes.pages} className={navClass(pathname.startsWith(routes.pages))}>
            Pages
          </Link>
          <Link href={routes.metaobjects} className={navClass(pathname.startsWith(routes.metaobjects))}>
            Metaobjects
          </Link>
          <Link href={routes.files} className={navClass(pathname.startsWith(routes.files))}>
            Files
          </Link>
          <Link href={routes.menus} className={navClass(pathname.startsWith(routes.menus))}>
            Menus
          </Link>
          <Link href={routes.blogPosts} className={navClass(pathname.startsWith(routes.blogPosts))}>
            Blog posts
          </Link>
        </nav>
      </div>

      {children}
    </div>
  );
}

export function SystemContentRoot({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-mint border-t-transparent" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <p className="text-sm text-gray-600">Sign in to manage content.</p>;
  }

  return (
    <StoreProvider token={token} storeSource="system">
      <ContentRoutesProvider basePath="/system/content">
        <SystemContentChrome>{children}</SystemContentChrome>
      </ContentRoutesProvider>
    </StoreProvider>
  );
}
