'use client';

import React, { Suspense, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import HeaderSearchSuggestions from '@/components/HeaderSearchSuggestions';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  getCartCount,
  CART_UPDATED_EVENT,
  getImageDisplayUrl,
  getStorefrontProducts,
  type StorefrontProduct,
} from '@/lib/api';
import { storefrontRequest, type StorefrontHeaderMenuItem } from '@/lib/storefrontApi';
import { storeSlugFromHost, storeSlugFromHostname } from '@/lib/storeSlug';
import { keycloakCallbackUrl } from '@/lib/keycloakRedirect';

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

const DEFAULT_MARKETPLACE_NAV: StorefrontHeaderMenuItem[] = [
  { label: 'Vehicles', url: '/vehicles' },
  { label: 'Real Estate', url: '/real-estate' },
  { label: 'Electronics', url: '/electronics' },
  { label: 'Groceries', url: '/groceries' },
];

function isExternalMenuUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith('mailto:') || url.startsWith('tel:');
}

type HeaderProps = {
  /** Store settings logo (subdomain storefront); footer uses the same API field. */
  companyLogoUrl?: string | null;
  /**
   * Admin → Content → Menus → Main menu. From store branding on the home page.
   * Omit on other routes: header loads the same menu on store subdomains via API.
   * `loading` shows default marketplace links until the branding request finishes.
   */
  adminNav?: 'loading' | StorefrontHeaderMenuItem[];
};

type HeaderCoreProps = HeaderProps & {
  /** From `?store=` on apex (mint-shop.pro); empty string when unknown (Suspense fallback). */
  storeQueryFromUrl: string;
  /** When on `/search`, mirrors `q` so the input matches the results page. */
  searchPrefill: string;
  /** Current path — used so we only sync `searchPrefill` on `/search` (avoids clearing input elsewhere). */
  currentPathname: string;
};

function HeaderCore({
  companyLogoUrl,
  adminNav,
  storeQueryFromUrl,
  searchPrefill,
  currentPathname,
}: HeaderCoreProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<StorefrontProduct[]>([]);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cartCount, setCartCountState] = useState(0);
  const [fetchedNav, setFetchedNav] = useState<StorefrontHeaderMenuItem[] | null>(null);
  /** Same source as admin Settings → company logo; used on subpages where Header is rendered without props. */
  const [fetchedCompanyLogoUrl, setFetchedCompanyLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (adminNav !== undefined) {
      return;
    }
    const slug = (storeQueryFromUrl ?? '').trim() || storeSlugFromHostname();
    if (!slug) {
      setFetchedCompanyLogoUrl(null);
      return;
    }
    let cancelled = false;
    storefrontRequest<{
      data?: { header_menu_items?: StorefrontHeaderMenuItem[]; company_logo_url?: string | null };
    }>('/storefront/store-branding', {
      store_slug: slug,
    })
      .then((res) => {
        if (cancelled) return;
        const raw = res.data?.header_menu_items;
        setFetchedNav(Array.isArray(raw) ? raw : []);
        const logo = res.data?.company_logo_url;
        setFetchedCompanyLogoUrl(
          typeof logo === 'string' && logo.trim() !== '' ? logo.trim() : null
        );
      })
      .catch(() => {
        if (!cancelled) {
          setFetchedNav([]);
          setFetchedCompanyLogoUrl(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [adminNav, storeQueryFromUrl]);

  const navItems = useMemo(() => {
    if (adminNav !== undefined) {
      if (adminNav === 'loading') {
        return DEFAULT_MARKETPLACE_NAV;
      }
      return adminNav.length > 0 ? adminNav : DEFAULT_MARKETPLACE_NAV;
    }
    if (fetchedNav !== null && fetchedNav.length > 0) {
      return fetchedNav;
    }
    return DEFAULT_MARKETPLACE_NAV;
  }, [adminNav, fetchedNav]);

  useEffect(() => {
    setCartCountState(getCartCount());
    const handler = () => setCartCountState(getCartCount());
    window.addEventListener(CART_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handler);
  }, []);

  useEffect(() => {
    if (currentPathname !== '/search') {
      return;
    }
    setSearchQuery(searchPrefill);
  }, [currentPathname, searchPrefill]);

  const handleProfileClick = () => {
    if (status !== 'authenticated') {
      // Not logged in: redirect to Keycloak login
      void signIn('keycloak', { callbackUrl: keycloakCallbackUrl('/auth/after-login'), redirect: true });
      return;
    }
    setUserMenuOpen((open) => !open);
  };

  const handleSignOut = async () => {
    clearUserTypeCookies();
    await signOut({ redirect: false });
    window.location.href = '/api/auth/keycloak-logout?callbackUrl=' + encodeURIComponent('/');
  };

  const handleAccountClick = () => {
    const onTenantHost =
      typeof window !== 'undefined' && Boolean(storeSlugFromHost(window.location.hostname));
    const userType = getCookie(USER_TYPE_COOKIE);
    setUserMenuOpen(false);
    if (!onTenantHost && userType === 'store_admin') {
      router.push('/admin/account');
    } else {
      router.push('/dashboard');
    }
  };

  const effectiveStoreSlug = useMemo(() => {
    const fromUrl = (storeQueryFromUrl ?? '').trim();
    if (fromUrl) {
      return fromUrl;
    }
    if (typeof window === 'undefined') {
      return '';
    }
    return storeSlugFromHostname() ?? '';
  }, [storeQueryFromUrl]);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 320);

  const closeSearchSuggestions = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setSearchFocused(false);
  }, []);

  const onSearchFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setSearchFocused(true);
  }, []);

  const onSearchBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => setSearchFocused(false), 200);
  }, []);

  useEffect(() => {
    if (!searchFocused) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSearchSuggestions();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchFocused, closeSearchSuggestions]);

  useEffect(() => {
    const q = debouncedSearchQuery.trim();
    if (q.length < 1) {
      setAutocompleteResults([]);
      setAutocompleteLoading(false);
      return;
    }
    let cancelled = false;
    setAutocompleteLoading(true);
    getStorefrontProducts({
      search: q,
      per_page: 8,
      page: 1,
      store: effectiveStoreSlug.trim() || undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setAutocompleteResults(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAutocompleteResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAutocompleteLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearchQuery, effectiveStoreSlug]);

  const suggestionsOpen = searchFocused && searchQuery.trim().length >= 1;

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchQuery.trim();
      if (!q) {
        return;
      }
      const params = new URLSearchParams();
      params.set('q', q);
      const slug = effectiveStoreSlug.trim();
      if (slug) {
        params.set('store', slug);
      }
      closeSearchSuggestions();
      router.push(`/search?${params.toString()}`);
    },
    [router, searchQuery, effectiveStoreSlug, closeSearchSuggestions]
  );

  const logoSource =
    typeof companyLogoUrl === 'string' && companyLogoUrl.trim() !== ''
      ? companyLogoUrl.trim()
      : fetchedCompanyLogoUrl;
  const resolvedLogo = logoSource ? getImageDisplayUrl(logoSource) : '';
  const useCustomLogo = Boolean(resolvedLogo && resolvedLogo !== '');

  const navLinkClass =
    'relative text-gray-700 hover:text-mint transition-colors font-medium text-sm group inline-block whitespace-nowrap shrink-0 py-2';
  const navUnderline = (
    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-mint group-hover:w-full transition-all duration-200" />
  );

  const renderNavLinks = (variant: 'desktop-bar' | 'mobile') => {
    return navItems.map((item) => {
      const cls =
        variant === 'mobile'
          ? 'px-4 py-2 text-gray-700 hover:text-mint hover:bg-mint/10 rounded-lg transition-colors font-medium'
          : navLinkClass;
      const wrap = variant === 'desktop-bar' ? navUnderline : null;
      if (isExternalMenuUrl(item.url)) {
        return (
          <a
            key={`${item.label}-${item.url}`}
            href={item.url}
            className={cls}
            rel="noopener noreferrer"
            {...(variant === 'mobile' ? { onClick: () => setMobileMenuOpen(false) } : {})}
          >
            {item.label}
            {wrap}
          </a>
        );
      }
      return (
        <Link
          key={`${item.label}-${item.url}`}
          href={item.url}
          className={cls}
          {...(variant === 'mobile' ? { onClick: () => setMobileMenuOpen(false) } : {})}
        >
          {item.label}
          {wrap}
        </Link>
      );
    });
  };

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-sm shadow-sm border-b border-gray-100"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--sf-color-background, #ffffff) 94%, transparent)',
        borderBottomColor: 'var(--sf-color-accent, #f3f4f6)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Primary row: logo, search, cart / account (Walmart-style top bar) */}
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group shrink-0">
            {useCustomLogo ? (
              <div className="relative h-14 w-auto max-w-[200px] group-hover:scale-105 transition-transform duration-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvedLogo}
                  alt="Store logo"
                  className="h-14 w-auto max-w-[200px] object-contain object-left"
                  width={200}
                  height={56}
                />
              </div>
            ) : (
              <div className="relative w-20 h-20 group-hover:scale-110 transition-transform duration-200">
                <Image
                  src="/logo.webp"
                  alt="Mint Hub Logo"
                  fill
                  sizes="80px"
                  className="object-contain"
                  priority
                />
              </div>
            )}
          </Link>

          {/* Search Bar (tablet/desktop) */}
          <div className="hidden md:flex flex-1 min-w-0 max-w-3xl mx-4 lg:mx-8 relative z-[55]">
            <form onSubmit={handleSearch} className="relative w-full" role="search">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
                placeholder="Search products, categories, brands…"
                className="block w-full pl-10 pr-12 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all text-sm text-gray-800 bg-white placeholder:text-gray-400"
                suppressHydrationWarning
                enterKeyHint="search"
                aria-label="Search products"
                autoComplete="off"
                aria-expanded={suggestionsOpen}
                aria-controls="header-search-suggestions-desktop"
                aria-autocomplete="list"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-1.5 my-auto h-9 w-9 rounded-md flex items-center justify-center text-gray-500 hover:text-mint hover:bg-mint/10 transition-colors"
                aria-label="Submit search"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <div id="header-search-suggestions-desktop">
                <HeaderSearchSuggestions
                  open={suggestionsOpen}
                  loading={autocompleteLoading}
                  results={autocompleteResults}
                  query={searchQuery}
                  storeSlug={effectiveStoreSlug}
                  onRequestClose={closeSearchSuggestions}
                />
              </div>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 shrink-0">
            <Link
              href="/cart"
              className="relative w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-mint hover:text-white transition-all duration-200 group"
              aria-label={cartCount > 0 ? `Shopping cart (${cartCount} items)` : 'Shopping cart'}
            >
              <svg className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center bg-mint text-white text-xs font-bold rounded-full">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Profile menu */}
            <div className="relative">
              <button
                type="button"
                onClick={handleProfileClick}
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-mint hover:text-white transition-all duration-200"
                aria-label="User profile"
                suppressHydrationWarning
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {status === 'authenticated' && userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 z-20 rounded-xl bg-white shadow-lg border border-gray-200 py-1">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session?.user?.name ?? 'Signed in user'}
                      </p>
                      {session?.user?.email && (
                        <p className="mt-0.5 text-xs text-gray-500 truncate">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-mint/10"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleAccountClick}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-mint/10"
                    >
                      Account
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-mint/10"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search (full width under primary row) */}
        <div className="md:hidden pb-3 -mt-0.5 relative z-[55]">
          <form onSubmit={handleSearch} className="relative w-full" role="search">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              placeholder="Search products…"
              className="block w-full pl-10 pr-12 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all text-sm text-gray-800 bg-white placeholder:text-gray-400"
              suppressHydrationWarning
              enterKeyHint="search"
              aria-label="Search products"
              autoComplete="off"
              aria-expanded={suggestionsOpen}
              aria-controls="header-search-suggestions-mobile"
              aria-autocomplete="list"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-1.5 my-auto h-9 w-9 rounded-md flex items-center justify-center text-gray-500 hover:text-mint hover:bg-mint/10 transition-colors"
              aria-label="Submit search"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <div id="header-search-suggestions-mobile">
              <HeaderSearchSuggestions
                open={suggestionsOpen}
                loading={autocompleteLoading}
                results={autocompleteResults}
                query={searchQuery}
                storeSlug={effectiveStoreSlug}
                onRequestClose={closeSearchSuggestions}
              />
            </div>
          </form>
        </div>

        {/* Secondary row: store menu under logo/search/actions (Walmart-style) */}
        <div
          className="hidden md:block border-t"
          style={{ borderTopColor: 'color-mix(in srgb, var(--sf-color-accent, #e5e7eb) 85%, transparent)' }}
        >
          <nav
            className="flex items-center gap-x-6 xl:gap-x-8 overflow-x-auto py-2 scroll-smooth min-h-[2.5rem]"
            aria-label="Main menu"
          >
            {renderNavLinks('desktop-bar')}
          </nav>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 animate-slide-up">
            <nav className="flex flex-col space-y-3">
              {renderNavLinks('mobile')}
              <div className="pt-4 border-t border-gray-200">
                <Link 
                  href="/login" 
                  className="block px-4 py-2 text-mint hover:bg-mint/10 rounded-lg transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function HeaderWithSearchParams(props: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeQueryFromUrl = (searchParams.get('store') ?? '').trim();
  const searchPrefill = pathname === '/search' ? (searchParams.get('q') ?? '') : '';
  return (
    <HeaderCore
      {...props}
      storeQueryFromUrl={storeQueryFromUrl}
      searchPrefill={searchPrefill}
      currentPathname={pathname}
    />
  );
}

export default function Header(props: HeaderProps) {
  return (
    <Suspense fallback={<HeaderCore {...props} storeQueryFromUrl="" searchPrefill="" currentPathname="" />}>
      <HeaderWithSearchParams {...props} />
    </Suspense>
  );
}
