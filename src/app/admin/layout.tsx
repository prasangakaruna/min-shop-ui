'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { apiRequest } from '@/lib/api';
import type { Me } from '@/lib/api';

type MenuItem = {
  href: string;
  label: string;
  icon?: string;
  children?: MenuItem[];
};

const menuItems: MenuItem[] = [
  { href: '/admin', label: 'Home', icon: '📊' },
  { href: '/admin/stores', label: 'Stores', icon: '🏪' },
  { href: '/admin/orders', label: 'Orders', icon: '🛒' },
  {
    href: '/admin/products',
    label: 'Products',
    icon: '📦',
    children: [
      { href: '/admin/collections', label: 'Collections' },
      { href: '/admin/inventory', label: 'Inventory' },
      { href: '/admin/purchase-orders', label: 'Purchase orders' },
      { href: '/admin/gift-cards', label: 'Gift cards' },
    ],
  },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  { href: '/admin/statistics', label: 'Analytics', icon: '📈' },
  {
    href: '/admin/pro',
    label: 'Pro & Admin',
    icon: '📊',
    children: [
      { href: '/admin/pro', label: 'Overview' },
      { href: '/admin/pro/api-settings', label: 'API Settings' },
      { href: '/admin/pro/integration', label: 'Integration' },
    ],
  },
  { href: '/admin/pro/api-settings', label: 'API Settings', icon: '🔑' },
  { href: '/admin/finance', label: 'Finance', icon: '💰' },
];

const SETUP_PATHS = ['/admin/setup', '/admin/stores/new'];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { stores, currentStore, setCurrentStore, loading: storeLoading, error: storeError } = useStore();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    if (storeLoading) return;
    const onSetupPath = SETUP_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
    if (stores.length === 0 && !onSetupPath) {
      router.replace('/admin/setup');
      return;
    }
    if (stores.length > 0 && pathname === '/admin/setup') {
      router.replace('/admin');
    }
  }, [storeLoading, stores.length, pathname, router]);

  useEffect(() => {
    const type = getCookie(USER_TYPE_COOKIE);
    if (type) setUserType(type);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen((o) => !o)}
                className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100"
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-mint rounded flex items-center justify-center">
                  <div className="w-4 h-4 bg-white transform rotate-45" />
                </div>
                <span className="text-lg font-bold text-gray-800 hidden sm:inline">Mint Admin</span>
              </Link>
              {/* Store switcher */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStoreDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 min-w-[160px]"
                >
                  {storeLoading ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : storeError ? (
                    <span className="text-red-600">Error</span>
                  ) : currentStore ? (
                    <>
                      <span className="truncate">{currentStore.name}</span>
                      <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  ) : (
                    <span className="text-gray-500">Select store</span>
                  )}
                </button>
                {storeDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" aria-hidden onClick={() => setStoreDropdownOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                      {stores.length === 0 && !storeLoading && (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No stores yet.{' '}
                          <Link href="/admin/stores/new" className="text-mint font-medium" onClick={() => setStoreDropdownOpen(false)}>
                            Create one
                          </Link>
                        </div>
                      )}
                      {stores.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setCurrentStore(s);
                            setStoreDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${currentStore?.id === s.id ? 'bg-mint/10 text-mint font-medium' : 'text-gray-700'}`}
                        >
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.slug}</div>
                        </button>
                      ))}
                      <Link
                        href="/admin/stores/new"
                        className="block px-4 py-2.5 text-sm text-mint font-medium hover:bg-mint/10 border-t border-gray-100"
                        onClick={() => setStoreDropdownOpen(false)}
                      >
                        + Add store
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="px-3 py-2 text-gray-600 hover:text-mint text-sm font-medium"
              >
                View storefront
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center text-mint hover:bg-mint/30"
                  aria-label="User menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" aria-hidden onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-800 truncate">{session?.user?.name ?? 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{session?.user?.email ?? ''}</p>
                      </div>
                      <Link
                        href="/admin/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        My account
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          setUserMenuOpen(false);
                          clearUserTypeCookies();
                          const { signOut } = await import('next-auth/react');
                          await signOut({ redirect: false });
                          window.location.href = '/api/auth/keycloak-logout?callbackUrl=' + encodeURIComponent('/');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          <aside
            className={`${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-200 lg:translate-x-0 pt-4 pb-6`}
          >
            <nav className="flex h-full flex-col justify-between">
              <div className="space-y-1 px-3">
                {menuItems
                  .filter((item) => {
                    if (item.href === '/admin/pro' && userType !== 'pro_admin') return false;
                    if (item.href === '/admin/pro/api-settings' && userType !== 'pro_admin') return false;
                    return true;
                  })
                  .map((item) => {
                    const targetHref =
                      userType === 'pro_admin' && item.href === '/admin' ? '/admin/pro' : item.href;
                    const isAdminSection =
                      item.href === '/admin/settings' ||
                      item.href === '/admin/statistics' ||
                      item.href === '/admin/pro' ||
                      item.href === '/admin/finance';
                    const isActiveTop =
                      pathname === targetHref ||
                      (targetHref !== '/admin' && pathname?.startsWith(targetHref));
                    const isExpanded =
                      expandedSections[item.href] !== undefined
                        ? expandedSections[item.href]
                        : isActiveTop || !item.children;

                    if (item.href === '/admin/settings') {
                      return (
                        <React.Fragment key={item.href}>
                          <div className="mt-4 mb-1 px-3 text-[11px] font-semibold tracking-[0.18em] text-gray-400 uppercase">
                            Administration
                          </div>
                          <div className="flex items-center justify-between">
                            <Link
                              href={targetHref}
                              className={`flex flex-1 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                isActiveTop
                                  ? 'bg-mint/10 text-mint'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {item.icon && <span className="text-lg">{item.icon}</span>}
                              {item.label}
                            </Link>
                          </div>
                        </React.Fragment>
                      );
                    }

                    return (
                      <div key={item.href}>
                        <div className="flex items-center justify-between">
                          <Link
                            href={targetHref}
                            className={`flex flex-1 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              isActiveTop
                                ? 'bg-mint/10 text-mint'
                                : isAdminSection
                                  ? 'text-gray-700 hover:bg-gray-50'
                                  : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {item.icon && <span className="text-lg">{item.icon}</span>}
                            {item.label}
                          </Link>
                          {item.children && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSections((prev) => ({
                                  ...prev,
                                  [item.href]: !isExpanded,
                                }))
                              }
                              className="ml-1 mr-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                            >
                              <svg
                                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M7 5L12 10L7 15"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                        {item.children && isExpanded && (
                          <div className="mt-0.5 mb-1 space-y-0.5 pl-8">
                            {item.children.map((child) => {
                              const isActiveChild =
                                pathname === child.href || pathname?.startsWith(child.href + '/');
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    isActiveChild
                                      ? 'bg-mint/10 text-mint'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  <span className="text-gray-300">↳</span>
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="mt-6 px-3 hidden lg:block">
                <div className="rounded-2xl border border-mint/20 bg-mint/5 px-4 py-3 text-xs text-gray-700">
                  <p className="font-semibold text-gray-900 mb-1">Upgrade to Enterprise</p>
                  <p className="text-[11px] text-gray-500">
                    Get advanced multi‑store control and custom reporting.
                  </p>
                  <button className="mt-2 inline-flex items-center justify-center rounded-full bg-mint px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-mint-dark">
                    Learn more
                  </button>
                </div>
              </div>
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            aria-hidden
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </>
  );
}

const USER_TYPE_COOKIE = 'USER_TYPE';
const USER_TYPE_TO_REGISTER = 'USER_TYPE_TO_REGISTER';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function clearUserTypeCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = `${USER_TYPE_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${USER_TYPE_TO_REGISTER}=; path=/; max-age=0`;
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/signup';

  if (!isAuthPage && status === 'unauthenticated') {
    router.replace('/login');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Redirecting to sign in...</p>
      </div>
    );
  }

  if (!isAuthPage && status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-mint border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  const accessToken = (session as { access_token?: string } | null)?.access_token ?? null;

  return (
    <StoreProvider token={accessToken}>
      <AdminGuard token={accessToken}>{children}</AdminGuard>
    </StoreProvider>
  );
}

function AdminGuard({ children, token }: { children: React.ReactNode; token: string | null }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    const userType = getCookie(USER_TYPE_COOKIE);
    if (userType === 'customer') {
      router.replace('/dashboard');
      return;
    }
    if (userType === 'store_admin' || userType === 'pro_admin') {
      setChecking(false);
      return;
    }
    apiRequest<Me>('/me', { token })
      .then((me) => {
        if (me.user_type === 'store_admin' || me.user_type === 'pro_admin') {
          setChecking(false);
        } else if (me.user_type == null) {
          router.replace('/auth/choose-type');
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => setChecking(false));
  }, [token, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-mint border-t-transparent rounded-full" />
      </div>
    );
  }
  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
