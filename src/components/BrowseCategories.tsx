'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const categories = [
  {
    title: 'Vehicles',
    listings: '2,450+ Listings',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
    link: '/vehicles',
  },
  {
    title: 'Real Estate',
    listings: '1,120+ Listings',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    link: '/real-estate',
  },
  {
    title: 'Home Electronics',
    listings: '5,800+ Listings',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',
    link: '/electronics',
  },
  {
    title: 'Groceries',
    listings: '1,240+ Listings',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    link: '/groceries',
  },
  {
    title: 'Fashion',
    listings: '3,200+ Listings',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
    link: '/products?category=fashion',
  },
  {
    title: 'Furniture',
    listings: '1,890+ Listings',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    link: '/products?category=furniture',
  },
  {
    title: 'Sports & Outdoors',
    listings: '980+ Listings',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    link: '/products?category=sports',
  },
  {
    title: 'Books & Media',
    listings: '2,100+ Listings',
    image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80',
    link: '/products?category=books',
  },
];

export default function BrowseCategories() {
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
  }, [currentIndex, cardsPerView]);

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
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Browse Categories</h2>
            <p className="text-gray-600">Find exactly what you&apos;re looking for</p>
          </div>
          <a href="/products" className="text-mint font-medium hover:text-mint-dark">
            View All →
          </a>
        </div>

        {/* Category Slider */}
        <div className="relative">
          {/* Navigation Arrows */}
          {canScrollLeft && (
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-mint hover:text-white transition-colors group"
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
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-mint hover:text-white transition-colors group"
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
                    className="relative h-64 rounded-lg overflow-hidden group cursor-pointer block"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundImage: `url(${category.image})` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold mb-1">{category.title}</h3>
                      <p className="text-gray-300">{category.listings}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {categories.length > cardsPerView && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              {Array.from({ length: Math.ceil(categories.length / cardsPerView) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToIndex(index * cardsPerView)}
                  className={`h-2 rounded-full transition-all ${
                    Math.floor(currentIndex / cardsPerView) === index
                      ? 'w-8 bg-mint'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
