'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type HeroProps = {
  variant?: 'default' | 'video';
};

export default function Hero({ variant = 'default' }: HeroProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    router.push(`/search?${params.toString()}`);
  };

  if (variant === 'video') {
    const primary = 'var(--sf-color-primary, #0f766e)';
    const accent = 'var(--sf-color-accent, #99f6e4)';
    return (
      <section
        className="relative h-[480px] md:h-[520px] overflow-hidden flex items-center"
        style={{ fontFamily: 'var(--sf-font-heading, inherit)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80')] bg-cover bg-center" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl text-white">
            <p className="text-xs uppercase tracking-[0.2em] mb-3 opacity-80">Featured</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Motion in Minimal</h1>
            <p className="text-slate-300 text-sm md:text-base mb-8">
              Curated pieces for modern living. Tap play to see the story, or shop the collection.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="px-6 py-3 text-sm font-semibold bg-white text-slate-900 shadow-lg transition hover:bg-slate-100"
                style={{ borderRadius: 'var(--sf-button-radius, 9999px)', borderWidth: 'var(--sf-button-border, 0)', borderStyle: 'solid', borderColor: primary }}
              >
                Explore Video
              </button>
              <button
                type="button"
                onClick={() => router.push('/products')}
                className="px-6 py-3 text-sm font-semibold border-2 border-white/80 text-white bg-transparent hover:bg-white/10"
                style={{ borderRadius: 'var(--sf-button-radius, 9999px)' }}
              >
                Shop Now
              </button>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition hover:scale-105"
              style={{ backgroundColor: accent, color: primary }}
              aria-label="Play video"
            >
              <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[500px] md:h-[550px] overflow-hidden">
      {/* Background Image with Multiple Layers */}
      <div className="absolute inset-0">
        {/* Base Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80")',
          }}
        ></div>
        
        {/* Gradient Overlays for Depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/85 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-mint/10 to-white/95 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent z-10"></div>
        
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-mint/20 via-transparent to-blue-500/20 z-10 animate-pulse"></div>
      </div>

      {/* Floating Shapes for Visual Interest */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-mint/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-300"></div>
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-2xl">
          {/* Tag with Enhanced Styling */}
          <div className="inline-flex items-center bg-mint/10 backdrop-blur-sm text-mint-dark px-4 py-2 rounded-full text-sm font-semibold mb-4 animate-fade-in border border-mint/20 shadow-md">
            <span className="w-2 h-2 bg-mint rounded-full mr-2 animate-pulse"></span>
            MINT CONDITION MARKETPLACE
          </div>

          {/* Headline with Text Shadow */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 animate-slide-up leading-tight">
            Sell Your Assets{' '}
            <span className="bg-gradient-to-r from-mint to-mint-dark bg-clip-text text-transparent">With Ease.</span>
          </h1>

          {/* Description with Better Contrast */}
          <p className="text-lg md:text-xl text-gray-700 mb-6 animate-slide-up delay-100 leading-relaxed max-w-xl">
            The premier marketplace for high-value trade. Browse verified cars, luxury villas, and professional tech from trusted sellers.
          </p>

          {/* Search Interface with Glassmorphism */}
          <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-4 animate-slide-up delay-200 border border-white/20">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for cars, villas, electronics..."
                className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all text-sm text-gray-800 bg-white placeholder:text-gray-400"
              />
            </div>
            <div className="relative">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white border-2 w-full border-gray-200 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-mint focus:border-mint transition-all text-sm font-medium text-gray-800"
              >
                <option value="all">All Categories</option>
                <option value="vehicles">Vehicles</option>
                <option value="real estate">Real Estate</option>
                <option value="electronics">Electronics</option>
                <option value="groceries">Groceries</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button 
              type="submit"
              className="bg-mint text-white px-8 py-3 rounded-lg font-semibold hover:bg-mint-dark transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>
          </form>

          {/* Quick Links with Better Styling */}
          <div className="mt-4 flex flex-wrap items-center gap-3 animate-fade-in delay-300">
            <span className="text-sm text-gray-600 font-medium">Popular:</span>
            {[
              { name: 'Vehicles', path: '/vehicles' },
              { name: 'Real Estate', path: '/real-estate' },
              { name: 'Electronics', path: '/electronics' },
              { name: 'Groceries', path: '/groceries' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="text-sm bg-mint/10 text-mint-dark px-3 py-1.5 rounded-full font-medium hover:bg-mint hover:text-white hover:scale-105 transition-all border border-mint/20"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
