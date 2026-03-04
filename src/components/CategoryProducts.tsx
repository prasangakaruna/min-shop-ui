'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const categories = [
  {
    id: 'vehicles',
    name: 'Vehicles',
    icon: '🚗',
    products: [
      {
        id: '1',
        image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
        title: '2024 Electric Signature SUV',
        price: '$84,900',
        location: 'Los Angeles, CA',
        badge: 'Verified Mint',
      },
      {
        id: '6',
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
        title: '2023 Luxury Sports Sedan',
        price: '$65,000',
        location: 'Austin, TX',
        badge: 'Hot Deal',
      },
    ],
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    icon: '🏠',
    products: [
      {
        id: '2',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        title: 'Waterfront Modern Villa',
        price: '$2.4M',
        location: 'Miami Beach, FL',
        badge: 'New Listing',
      },
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: '📱',
    products: [
      {
        id: '3',
        image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&q=80',
        title: '8K Professional Cinema Camera',
        price: '$12,500',
        location: 'New York, NY',
        badge: 'Best Deal',
      },
      {
        id: '4',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        title: 'Pro Wireless ANC Headphones',
        price: '$299.00',
        location: 'San Francisco, CA',
        badge: 'Top Seller',
      },
      {
        id: '5',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
        title: 'Lumix X1 Mirrorless Camera',
        price: '$1,499.00',
        location: 'Seattle, WA',
        badge: 'Premium',
      },
    ],
  },
  {
    id: 'groceries',
    name: 'Groceries',
    icon: '🛒',
    products: [
      {
        id: '7',
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',
        title: 'Organic Premium Grocery Bundle',
        price: '$89.99',
        location: 'Portland, OR',
        badge: 'Fresh',
      },
      {
        id: '13',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
        title: 'Organic Farm Fresh Produce',
        price: '$45.99',
        location: 'Sacramento, CA',
        badge: 'Fresh',
      },
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: '👔',
    products: [
      {
        id: '14',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
        title: 'Designer Fashion Collection',
        price: '$349.00',
        location: 'New York, NY',
        badge: 'Trending',
      },
    ],
  },
  {
    id: 'furniture',
    name: 'Furniture',
    icon: '🪑',
    products: [
      {
        id: '15',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
        title: 'Modern Luxury Furniture Set',
        price: '$2,899.00',
        location: 'Boston, MA',
        badge: 'New',
      },
    ],
  },
];

export default function CategoryProducts() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  return (
    <section className="py-16 bg-white relative overflow-hidden border-t border-gray-100">
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 text-center">
          <div className="inline-block bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-xs font-semibold mb-2">
            CATEGORIES
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">Shop by Category</h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">Browse products from your favorite categories</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side - Categories */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-xl p-4 space-y-1.5 shadow-lg border border-mint/10">
              <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">Categories</h3>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${
                    selectedCategory.id === category.id
                      ? 'bg-mint text-white shadow-lg scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:scale-102'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                    <span className={`ml-auto text-sm ${
                      selectedCategory.id === category.id ? 'text-white' : 'text-gray-500'
                    }`}>
                      ({category.products.length})
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side - Products */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCategory.name}</h3>
                <p className="text-sm text-gray-600">{selectedCategory.products.length} products</p>
              </div>
              <Link
                href={`/${selectedCategory.id === 'real-estate' ? 'real-estate' : selectedCategory.id}`}
                className="text-mint font-semibold hover:text-mint-dark transition-colors flex items-center space-x-1"
              >
                <span>View All</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedCategory.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group border border-mint/10"
                >
                  {/* Image */}
                  <Link href={`/product/${product.id}`} className="block relative h-40 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {product.badge && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-mint text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                          {product.badge}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="p-4">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="text-base font-bold text-gray-900 mb-1.5 hover:text-mint transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                    </Link>
                    <p className="text-xl font-bold text-mint mb-2">{product.price}</p>
                    <p className="text-xs text-gray-600 mb-3 flex items-center">
                      <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {product.location}
                    </p>
                    <Link
                      href={`/product/${product.id}`}
                      className="block w-full bg-mint text-white py-2 rounded-lg font-semibold hover:bg-mint-dark transition-all shadow-sm hover:shadow-md text-center text-xs"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
