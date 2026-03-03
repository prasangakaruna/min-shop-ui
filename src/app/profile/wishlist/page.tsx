'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

const wishlistItems = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    title: 'Pro Wireless ANC Headphones',
    category: 'AUDIO & HEADPHONES',
    price: '$299.00',
    originalPrice: '$349.00',
    rating: 4.9,
    badge: 'TOP SELLER',
    badgeColor: 'mint' as const,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    title: 'Lumix X1 Mirrorless Camera',
    category: 'CAMERAS & PHOTOGRAPHY',
    price: '$1,499.00',
    rating: 4.7,
    badge: null,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=80',
    title: 'Tactile RGB Gaming Keyboard',
    category: 'GAMING',
    price: '$159.00',
    rating: 4.8,
    badge: null,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',
    title: 'Organic Honeycrisp Apples',
    category: 'FRUITS',
    price: '$4.99',
    rating: 4.8,
    badge: 'ORGANIC',
    badgeColor: 'mint' as const,
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    title: '34" Curved UltraWide Monitor',
    category: 'MONITORS',
    price: '$549.00',
    rating: 4.6,
    badge: null,
  },
];

export default function WishlistPage() {
  const [items, setItems] = useState(wishlistItems);

  const removeFromWishlist = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-mint">Home</Link></li>
            <li>/</li>
            <li><Link href="/profile" className="hover:text-mint">Profile</Link></li>
            <li>/</li>
            <li className="text-gray-800">Wishlist</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">My Wishlist</h1>
            <p className="text-gray-600">{items.length} {items.length === 1 ? 'item' : 'items'} saved</p>
          </div>
          {items.length > 0 && (
            <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors">
              Clear All
            </button>
          )}
        </div>

        {/* Wishlist Items */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="relative">
                <ProductCard {...item} />
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors z-10"
                  aria-label="Remove from wishlist"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">Start adding items you love to your wishlist!</p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-colors"
            >
              Browse Products
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
