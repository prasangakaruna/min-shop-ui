'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useStorefront } from '@/context/StorefrontContext';
import { formatCategoryLabel, isCategoryHiddenFromStorefrontBrowse } from '@/lib/categories';
import { getImageDisplayUrl } from '@/lib/api';
import { storefrontRequest, type StorefrontBrowseCategoriesResponse } from '@/lib/storefrontApi';
import {
  STOREFRONT_PRIMARY_BODY_LINK_CLASS,
  STOREFRONT_PRIMARY_BUTTON_STYLE,
  STOREFRONT_PRIMARY_SOLID_HOVER_CLASS,
} from '@/lib/storefrontHomeTheme';

const CATEGORY_IMAGES: Record<string, string> = {
  vehicles: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
  'real estate': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  electronics: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',
  groceries: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
  fashion: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
  furniture: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
};

const CATEGORY_COLORS: Record<string, string> = {
  vehicles: 'from-blue-500/20 to-blue-600/20',
  'real estate': 'from-purple-500/20 to-purple-600/20',
  electronics: 'from-mint/20 to-mint-dark/20',
  groceries: 'from-green-500/20 to-green-600/20',
  fashion: 'from-pink-500/20 to-pink-600/20',
  default: 'from-gray-500/20 to-gray-600/20',
};

interface BrowseCategoriesProps {
  categories?: { id: string; title: string; count: number; link: string; imageUrl?: string | null }[];
  loading?: boolean;
}

function deriveCategoriesFromProducts(
  products: { category: string | null }[],
  storeSlug?: string | null
): { id: string; title: string; count: number; link: string; imageUrl: string | null }[] {
  const map = new Map<string, number>();
  products.forEach((p) => {
    const cat = (p.category && p.category.trim()) || 'Other';
    map.set(cat, (map.get(cat) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .filter(([rawId]) => !isCategoryHiddenFromStorefrontBrowse(rawId))
    .map(([rawId, count]) => ({
      id: rawId,
      title: formatCategoryLabel(rawId),
      count,
      link: storeSlug
        ? `/products?category=${encodeURIComponent(rawId)}&store=${encodeURIComponent(storeSlug)}`
        : `/products?category=${encodeURIComponent(rawId)}`,
      imageUrl: null,
    }))
    .sort((a, b) => b.count - a.count);
}

function resolveCategoryCardImage(title: string, imageUrl: string | null | undefined): string {
  const fromStore = imageUrl?.trim() ? getImageDisplayUrl(imageUrl).trim() : '';
  if (fromStore) return fromStore;
  const key = title.toLowerCase();
  return CATEGORY_IMAGES[key] ?? CATEGORY_IMAGES.default;
}

export default function BrowseCategories({ categories: propCategories, loading: propLoading }: BrowseCategoriesProps = {}) {
  const storefront = useStorefront();
  const storeSlug = storefront?.storeSlug ?? null;
  const [browseRows, setBrowseRows] = useState<StorefrontBrowseCategoriesResponse['data']['categories'] | null>(null);
  const [browseLoading, setBrowseLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setBrowseLoading(true);
    storefrontRequest<StorefrontBrowseCategoriesResponse>('/storefront/browse-categories', {
      ...(storeSlug ? { store: storeSlug } : {}),
    })
      .then((r) => {
        if (cancelled) return;
        setBrowseRows(Array.isArray(r.data?.categories) ? r.data!.categories : []);
      })
      .catch(() => {
        if (cancelled) return;
        setBrowseRows(null);
      })
      .finally(() => {
        if (!cancelled) setBrowseLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  const derived = useMemo(
    () => (storefront ? deriveCategoriesFromProducts(storefront.products, storefront.storeSlug) : []),
    [storefront?.products, storefront?.storeSlug]
  );

  const baseRows = useMemo(() => {
    if (propCategories != null) return propCategories;
    if (browseRows !== null) {
      return browseRows
        .filter((row) => !isCategoryHiddenFromStorefrontBrowse(row.id))
        .map((row) => ({
          id: row.id,
          title: formatCategoryLabel(row.id),
          count: row.count,
          link: storeSlug
            ? `/products?category=${encodeURIComponent(row.id)}&store=${encodeURIComponent(storeSlug)}`
            : `/products?category=${encodeURIComponent(row.id)}`,
          imageUrl: row.image_url ?? null,
        }));
    }
    return derived;
  }, [propCategories, browseRows, derived, storeSlug]);

  const loading =
    propLoading ?? (propCategories == null ? browseLoading || (browseRows === null && (storefront?.loading ?? false)) : false);

  const categories = useMemo(() => {
    return baseRows.map((c) => ({
      slug: c.id,
      title: c.title,
      listings: `${c.count} Listing${c.count !== 1 ? 's' : ''}`,
      image: resolveCategoryCardImage(c.title, c.imageUrl ?? null),
      link: c.link,
      icon: '📦',
      color: CATEGORY_COLORS[c.title.toLowerCase()] ?? CATEGORY_COLORS.default,
    }));
  }, [baseRows]);
  const ROWS_PER_PAGE = 2;
  const [currentPage, setCurrentPage] = useState(0);
  /** Cards per row; each viewport shows two rows (see ROWS_PER_PAGE). */
  const [cardsPerRow, setCardsPerRow] = useState(4);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const cardsPerPage = cardsPerRow * ROWS_PER_PAGE;

  const pages = useMemo(() => {
    const chunks: typeof categories[] = [];
    for (let i = 0; i < categories.length; i += cardsPerPage) {
      chunks.push(categories.slice(i, i + cardsPerPage));
    }
    return chunks;
  }, [categories, cardsPerPage]);

  useEffect(() => {
    const updateCardsPerRow = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCardsPerRow(1);
      } else if (width < 1024) {
        setCardsPerRow(2);
      } else {
        setCardsPerRow(4);
      }
    };

    updateCardsPerRow();
    window.addEventListener('resize', updateCardsPerRow);
    return () => window.removeEventListener('resize', updateCardsPerRow);
  }, []);

  useEffect(() => {
    const last = Math.max(0, pages.length - 1);
    setCurrentPage((p) => Math.min(p, last));
  }, [pages.length]);

  useEffect(() => {
    setCanScrollLeft(currentPage > 0);
    setCanScrollRight(currentPage < Math.max(0, pages.length - 1));
  }, [currentPage, pages.length]);

  const goToPage = (page: number) => {
    const last = Math.max(0, pages.length - 1);
    setCurrentPage(Math.max(0, Math.min(page, last)));
  };

  const scrollPrev = () => {
    goToPage(currentPage - 1);
  };

  const scrollNext = () => {
    goToPage(currentPage + 1);
  };

  const translateX = -(currentPage * 100);

  const gridColsClass =
    cardsPerRow === 1 ? 'grid-cols-1' : cardsPerRow === 2 ? 'grid-cols-2' : 'grid-cols-4';

  return (
    <section className="py-16 bg-gray-50 relative overflow-hidden border-t border-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%234FD1C7' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex items-center gap-2 bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-xs font-bold border border-mint/20 shadow-sm">
                <span className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse"></span>
                EXPLORE CATEGORIES
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-mint/30 to-transparent"></div>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold sf-heading-color leading-tight">
                Browse{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-mint to-mint-dark bg-clip-text text-transparent">
                    Categories
                  </span>
                  <span className="absolute bottom-1.5 left-0 right-0 h-2.5 bg-mint/20 -z-0 transform -skew-x-12"></span>
                </span>
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl leading-relaxed">
                Discover amazing products across all categories and find exactly what you&apos;re looking for
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Link
              href={storeSlug ? `/products?store=${encodeURIComponent(storeSlug)}` : '/products'}
              className={`group inline-flex items-center space-x-2 rounded-xl border-2 bg-white px-5 py-2.5 font-semibold shadow-md transition-all duration-300 hover:border-[color:var(--sf-color-button,var(--sf-color-primary,#4FD1C7))] hover:bg-[color:var(--sf-color-button,var(--sf-color-primary,#4FD1C7))] hover:text-white hover:shadow-xl`}
              style={{
                borderColor:
                  'color-mix(in srgb, var(--sf-color-button, var(--sf-color-primary, #4FD1C7)) 32%, #e5e7eb)',
                color: 'var(--sf-color-button, var(--sf-color-primary, #4FD1C7))',
              }}
            >
              <span>View All</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Category Slider */}
        <div className="relative">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-56 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
              <p className="text-gray-600">No categories yet. Products will appear here once stores add them.</p>
              <Link
                href={storeSlug ? `/products?store=${encodeURIComponent(storeSlug)}` : '/products'}
                className={`mt-4 inline-block ${STOREFRONT_PRIMARY_BODY_LINK_CLASS}`}
              >
                View all products
              </Link>
            </div>
          ) : (
          <>
          {/* Navigation Arrows */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={scrollPrev}
              className="group absolute left-0 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white shadow-xl transition-all duration-300 hover:scale-110 hover:border-[color:var(--sf-color-button,var(--sf-color-primary,#4FD1C7))] hover:bg-[color:var(--sf-color-button,var(--sf-color-primary,#4FD1C7))] hover:text-white"
              aria-label="Previous categories"
            >
              <svg
                className="w-6 h-6 text-gray-800 group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {canScrollRight && (
            <button
              type="button"
              onClick={scrollNext}
              className="group absolute right-0 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white shadow-xl transition-all duration-300 hover:scale-110 hover:border-[color:var(--sf-color-button,var(--sf-color-primary,#4FD1C7))] hover:bg-[color:var(--sf-color-button,var(--sf-color-primary,#4FD1C7))] hover:text-white"
              aria-label="Next categories"
            >
              <svg
                className="w-6 h-6 text-gray-800 group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Two-row paged grid */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(${translateX}%)`,
              }}
            >
              {pages.map((page, pageIndex) => (
                <div
                  key={pageIndex}
                  className="min-w-full shrink-0 px-0 sm:px-1"
                >
                  <div className={`grid ${gridColsClass} gap-4 md:gap-6`}>
                    {page.map((category) => (
                      <Link
                        key={category.slug}
                        href={category.link}
                        className="group relative block h-56 cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-all duration-300 hover:border-[color:color-mix(in_srgb,var(--sf-color-primary,#4FD1C7)_22%,transparent)] hover:shadow-2xl"
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ backgroundImage: `url(${category.image})` }}
                        />
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
                        <div className="absolute top-4 left-4 z-10">
                          <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                            {category.icon}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
                          <h3 className="mb-1.5 text-xl font-bold transition-colors duration-300 group-hover:text-[color:var(--sf-color-accent,var(--sf-color-primary,#4FD1C7))]">
                            {category.title}
                          </h3>
                          <p className="text-white/90 text-sm font-medium mb-3">{category.listings}</p>
                          <div className="flex items-center text-white transition-colors duration-300 group-hover:text-[color:var(--sf-color-accent,var(--sf-color-primary,#4FD1C7))]">
                            <span className="text-sm font-semibold mr-2">Explore Now</span>
                            <svg
                              className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {pages.length > 1 && (
            <div className="flex justify-center items-center space-x-3 mt-8">
              {pages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToPage(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentPage === index ? 'w-10 shadow-md' : 'w-2.5 bg-gray-300 hover:w-6 hover:bg-gray-400'
                  }`}
                  style={currentPage === index ? STOREFRONT_PRIMARY_BUTTON_STYLE : undefined}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* View All Link */}
          <div className="text-center mt-10">
            <Link
              href={storeSlug ? `/products?store=${encodeURIComponent(storeSlug)}` : '/products'}
              className={`inline-flex items-center space-x-2 rounded-xl px-8 py-3 font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${STOREFRONT_PRIMARY_SOLID_HOVER_CLASS}`}
              style={STOREFRONT_PRIMARY_BUTTON_STYLE}
            >
              <span>View All Categories</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          </>
          )}
        </div>
      </div>
    </section>
  );
}
