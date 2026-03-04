'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative w-20 h-20 group-hover:scale-110 transition-transform duration-200">
              <Image
                src="/logo.webp"
                alt="Mint Hub Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
             
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets (e.g. 2024 Electric SUV)"
                className="block w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all text-sm text-gray-800 bg-white placeholder:text-gray-400"
              />
            </form>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link href="/vehicles" className="text-gray-700 hover:text-mint transition-colors font-medium text-sm relative group">
              Vehicles
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-mint group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link href="/real-estate" className="text-gray-700 hover:text-mint transition-colors font-medium text-sm relative group">
              Real Estate
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-mint group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link href="/electronics" className="text-gray-700 hover:text-mint transition-colors font-medium text-sm relative group">
              Electronics
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-mint group-hover:w-full transition-all duration-200"></span>
            </Link>
            <Link href="/groceries" className="text-gray-700 hover:text-mint transition-colors font-medium text-sm relative group">
              Groceries
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-mint group-hover:w-full transition-all duration-200"></span>
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Link 
              href="/checkout/payment" 
              className="relative w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-mint hover:text-white transition-all duration-200 group"
              aria-label="Shopping cart"
            >
              <svg className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-mint text-white rounded-full text-xs font-bold flex items-center justify-center shadow-md">
                3
              </span>
            </Link>
            <Link
              href="/profile"
              className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-mint hover:text-white transition-all duration-200"
              aria-label="User profile"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 animate-slide-up">
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/vehicles" 
                className="px-4 py-2 text-gray-700 hover:text-mint hover:bg-mint/10 rounded-lg transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Vehicles
              </Link>
              <Link 
                href="/real-estate" 
                className="px-4 py-2 text-gray-700 hover:text-mint hover:bg-mint/10 rounded-lg transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Real Estate
              </Link>
              <Link 
                href="/electronics" 
                className="px-4 py-2 text-gray-700 hover:text-mint hover:bg-mint/10 rounded-lg transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Electronics
              </Link>
              <Link 
                href="/groceries" 
                className="px-4 py-2 text-gray-700 hover:text-mint hover:bg-mint/10 rounded-lg transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Groceries
              </Link>
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
