'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { storefrontRequest } from '@/lib/storefrontApi';
import { getImageDisplayUrl } from '@/lib/api';

type SocialLinks = {
  facebook?: string | null;
  instagram?: string | null;
  x?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
};

type StoreBranding = {
  company_description?: string | null;
  company_logo_url?: string | null;
  company_cover_image_url?: string | null;
  social_links?: SocialLinks;
};

export default function Footer() {
  const [branding, setBranding] = useState<StoreBranding | null>(null);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromQuery = new URLSearchParams(window.location.search).get('store');
    if (fromQuery && fromQuery.trim() !== '') {
      setStoreSlug(fromQuery.trim());
      return;
    }

    // Fallback: parse subdomain from host (e.g. myshop.localhost -> "myshop")
    const host = window.location.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') {
      setStoreSlug(null);
      return;
    }
    const parts = host.split('.').filter(Boolean);
    if (parts.length < 2) {
      setStoreSlug(null);
      return;
    }
    const effectiveParts = parts[0] === 'www' && parts.length >= 3 ? parts.slice(1) : parts;
    setStoreSlug(effectiveParts[0] ?? null);
  }, []);

  useEffect(() => {
    if (!storeSlug) return;
    let cancelled = false;

    storefrontRequest<{ data: StoreBranding }>('/storefront/store-branding', { store_slug: storeSlug })
      .then((res) => {
        if (cancelled) return;
        setBranding(res.data ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setBranding(null);
      })
      .finally(() => {});

    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  const logoUrl = branding?.company_logo_url ? getImageDisplayUrl(branding.company_logo_url) : '/logo.webp';
  const description =
    branding?.company_description?.trim() ||
    'The ultimate destination for buying and selling high-value assets. We ensure every transaction is handled with the care and security you deserve.';

  const social = branding?.social_links ?? {};
  const socialItems: Array<{ key: keyof SocialLinks; label: string; href?: string | null }> = [
    { key: 'facebook', label: 'Facebook', href: social.facebook ?? null },
    { key: 'instagram', label: 'Instagram', href: social.instagram ?? null },
    { key: 'x', label: 'X', href: social.x ?? null },
    { key: 'twitter', label: 'Twitter', href: social.twitter ?? null },
    { key: 'linkedin', label: 'LinkedIn', href: social.linkedin ?? null },
    { key: 'youtube', label: 'YouTube', href: social.youtube ?? null },
    { key: 'tiktok', label: 'TikTok', href: social.tiktok ?? null },
  ];

  const visibleSocial = socialItems.filter((i) => typeof i.href === 'string' && (i.href ?? '').trim() !== '');

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Mint Hub Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4 group">
              <img
                src={logoUrl}
                alt="Company logo"
                className="h-16 w-16 object-contain group-hover:scale-110 transition-transform duration-200"
              />
            </Link>
            <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
            <div className="flex space-x-3">
              {visibleSocial.length === 0 ? (
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-mint hover:text-white hover:border-mint transition-all duration-200"
                  aria-label="Social links not configured"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657A9.003 9.003 0 0019 12a7.002 7.002 0 00-7-7 7.002 7.002 0 00-7 7 9.003 9.003 0 001.343 4.657" />
                  </svg>
                </a>
              ) : (
                visibleSocial.map((item) => (
                  <a
                    key={item.key}
                    href={item.href ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-mint hover:text-white hover:border-mint transition-all duration-200"
                    aria-label={item.label}
                  >
                    {item.key === 'facebook' && (
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                      </svg>
                    )}
                    {item.key === 'instagram' && (
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="4" ry="4" strokeWidth="2" />
                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth="2" />
                        <path d="M17.5 6.5h.01" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                    {(item.key === 'x' || item.key === 'twitter') && (
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 20l8-11 3 4 5-6-1 2-4 6-3-4-7 10z"
                        />
                      </svg>
                    )}
                    {item.key === 'linkedin' && (
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 9h4v11H4z" />
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 9h4v2c.7-1.2 2-2 3.5-2 3 0 3.5 2 3.5 5v6h-4v-6c0-1.2 0-2-1.2-2-1.1 0-1.3.8-1.3 2v6h-4z" />
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 4a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                    )}
                    {item.key === 'youtube' && (
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 15l5-3-5-3v6z" />
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4-1 7-9 7S3 16 3 12s1-7 9-7 9 3 9 7z" />
                      </svg>
                    )}
                    {item.key === 'tiktok' && (
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 3v14a3 3 0 01-3 3 3 3 0 01-3-3c0-1.66 1.34-3 3-3 1 0 2 .5 3 1.5V3h3z" />
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 3h4" />
                      </svg>
                    )}
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Marketplace Links */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Marketplace</h3>
            <ul className="space-y-3">
              <li><Link href="/products" className="text-gray-600 hover:text-mint transition-colors text-sm">Browse Vehicles</Link></li>
              <li><Link href="/products" className="text-gray-600 hover:text-mint transition-colors text-sm">Real Estate Listings</Link></li>
              <li><Link href="/products" className="text-gray-600 hover:text-mint transition-colors text-sm">Home Electronics</Link></li>
              <li><Link href="/groceries" className="text-gray-600 hover:text-mint transition-colors text-sm">Groceries</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3">
              <li><Link href="/dashboard" className="text-gray-600 hover:text-mint transition-colors text-sm">My Account</Link></li>
              <li><Link href="/profile/orders" className="text-gray-600 hover:text-mint transition-colors text-sm">Order History</Link></li>
              <li><Link href="/profile/settings" className="text-gray-600 hover:text-mint transition-colors text-sm">Settings</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-mint transition-colors text-sm">Help Center</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Newsletter</h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Get the latest asset drops and market reports delivered to your inbox.
            </p>
            <form className="flex" onSubmit={(e) => { e.preventDefault(); }}>
              <input
                type="email"
                placeholder="Your email"
                required
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-mint focus:border-transparent text-sm"
                suppressHydrationWarning
              />
              <button
                type="submit"
                className="bg-mint text-white px-4 py-2.5 rounded-r-lg hover:bg-mint-dark transition-colors flex items-center justify-center"
                aria-label="Subscribe to newsletter"
                suppressHydrationWarning
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} MINT HUB Marketplace. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="#" className="text-gray-600 hover:text-mint text-sm transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-gray-600 hover:text-mint text-sm transition-colors">Terms of Service</Link>
              <Link href="#" className="text-gray-600 hover:text-mint text-sm transition-colors">Cookie Policy</Link>
              <Link href="#" className="text-gray-600 hover:text-mint text-sm transition-colors">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
