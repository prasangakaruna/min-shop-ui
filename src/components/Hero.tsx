'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Hero() {
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

  return (
    <section className="relative h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/80 to-transparent z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-sm"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80")',
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-2xl">
          {/* Tag */}
          <div className="inline-block bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-sm font-medium mb-4 animate-fade-in">
            MINT CONDITION MARKETPLACE
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 animate-slide-up">
            Sell Your Assets{' '}
            <span className="text-mint">With Ease.</span>
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 animate-slide-up delay-100">
            The premier marketplace for high-value trade. Browse verified cars, luxury villas, and professional tech from trusted sellers.
          </p>

          {/* Search Interface */}
          <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3 animate-slide-up delay-200">
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
                className="appearance-none bg-white border-2 border-gray-200 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-mint focus:border-mint transition-all text-sm font-medium text-gray-800"
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

          {/* Quick Links */}
          <div className="mt-6 flex flex-wrap gap-3 animate-fade-in delay-300">
            <span className="text-sm text-gray-600">Popular:</span>
            <button
              onClick={() => router.push('/vehicles')}
              className="text-sm text-mint hover:text-mint-dark font-medium hover:underline"
            >
              Vehicles
            </button>
            <button
              onClick={() => router.push('/real-estate')}
              className="text-sm text-mint hover:text-mint-dark font-medium hover:underline"
            >
              Real Estate
            </button>
            <button
              onClick={() => router.push('/electronics')}
              className="text-sm text-mint hover:text-mint-dark font-medium hover:underline"
            >
              Electronics
            </button>
            <button
              onClick={() => router.push('/groceries')}
              className="text-sm text-mint hover:text-mint-dark font-medium hover:underline"
            >
              Groceries
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
