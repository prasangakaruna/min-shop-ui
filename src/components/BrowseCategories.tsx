'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useStorefront } from '@/context/StorefrontContext';
import { formatCategoryLabel } from '@/lib/categories';

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
  categories?: { title: string; count: number; link: string }[];
  loading?: boolean;
}

function deriveCategoriesFromProducts(products: { category: string | null }[]): { title: string; count: number; link: string }[] {
  const map = new Map<string, number>();
  products.forEach((p) => {
    const cat = (p.category && p.category.trim()) || 'Other';
    map.set(cat, (map.get(cat) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([rawId, count]) => ({
      title: formatCategoryLabel(rawId),
      // keep the original ID in the query so the backend filter still works
      count,
      link: `/products?category=${encodeURIComponent(rawId)}`,
    }))
    .sort((a, b) => b.count - a.count);
}

export default function BrowseCategories({ categories: propCategories, loading: propLoading }: BrowseCategoriesProps = {}) {
  const storefront = useStorefront();
  const derived = useMemo(
    () => (storefront ? deriveCategoriesFromProducts(storefront.products) : []),
    [storefront?.products]
  );
  const propCategoriesSafe = propCategories ?? derived;
  const loading = propLoading ?? storefront?.loading ?? false;

  const categories = useMemo(() => {
    return propCategoriesSafe.map((c) => ({
      title: c.title,
      listings: `${c.count} Listing${c.count !== 1 ? 's' : ''}`,
      image: CATEGORY_IMAGES[c.title.toLowerCase()] ?? CATEGORY_IMAGES.default,
      link: c.link,
      icon: '📦',
      color: CATEGORY_COLORS[c.title.toLowerCase()] ?? CATEGORY_COLORS.default,
    }));
  }, [propCategoriesSafe]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCardsPerView = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCardsPerView(1);
      } else if (width < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(4);
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  useEffect(() => {
    const maxIndex = Math.max(0, categories.length - cardsPerView);
    setCanScrollLeft(currentIndex > 0);
    setCanScrollRight(currentIndex < maxIndex);
  }, [currentIndex, cardsPerView, categories.length]);

  const scrollToIndex = (index: number) => {
    const maxIndex = Math.max(0, categories.length - cardsPerView);
    const newIndex = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(newIndex);
  };

  const scrollPrev = () => {
    scrollToIndex(currentIndex - 1);
  };

  const scrollNext = () => {
    scrollToIndex(currentIndex + 1);
  };

  const translateX = -(currentIndex * (100 / cardsPerView));

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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
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
              href="/products" 
              className="inline-flex items-center space-x-2 group bg-white border-2 border-mint/30 text-mint-dark px-5 py-2.5 rounded-xl font-semibold hover:bg-mint hover:text-white hover:border-mint transition-all duration-300 shadow-md hover:shadow-xl"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-56 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
              <p className="text-gray-600">No categories yet. Products will appear here once stores add them.</p>
              <Link href="/products" className="mt-4 inline-block text-mint font-medium hover:underline">View all products</Link>
            </div>
          ) : (
          <>
          {/* Navigation Arrows */}
          {canScrollLeft && (
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-mint hover:text-white transition-all duration-300 group border border-gray-100 hover:border-mint hover:scale-110"
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
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-mint hover:text-white transition-all duration-300 group border border-gray-100 hover:border-mint hover:scale-110"
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

          {/* Slider Container */}
          <div className="overflow-hidden">
            <div
              ref={scrollContainerRef}
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(${translateX}%)`,
              }}
            >
              {categories.map((category, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 px-3"
                  style={{ width: `${100 / cardsPerView}%` }}
                >
                  <Link
                    href={category.link}
                    className="relative h-56 rounded-2xl overflow-hidden group cursor-pointer block bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-mint/30"
                  >
                    {/* Image Background */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(${category.image})` }}
                    ></div>
                    
                    {/* Gradient Overlays */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent"></div>
                    
                    {/* Icon Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                        {category.icon}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
                      <h3 className="text-xl font-bold mb-1.5 group-hover:text-mint-light transition-colors duration-300">{category.title}</h3>
                      <p className="text-white/90 text-sm font-medium mb-3">{category.listings}</p>
                      <div className="flex items-center text-white group-hover:text-mint-light transition-colors duration-300">
                        <span className="text-sm font-semibold mr-2">Explore Now</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {categories.length > cardsPerView && (
            <div className="flex justify-center items-center space-x-3 mt-8">
              {Array.from({ length: Math.ceil(categories.length / cardsPerView) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToIndex(index * cardsPerView)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    Math.floor(currentIndex / cardsPerView) === index
                      ? 'w-10 bg-mint shadow-md'
                      : 'w-2.5 bg-gray-300 hover:bg-gray-400 hover:w-6'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* View All Link */}
          <div className="text-center mt-10">
            <Link 
              href="/products" 
              className="inline-flex items-center space-x-2 bg-mint text-white px-8 py-3 rounded-xl font-semibold hover:bg-mint-dark transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
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
