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
        originalPrice: '$92,000',
        location: 'Los Angeles, CA',
        badge: 'Verified Mint',
        rating: 4.9,
      },
      {
        id: '6',
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
        title: '2023 Luxury Sports Sedan',
        price: '$65,000',
        location: 'Austin, TX',
        badge: 'Hot Deal',
        rating: 4.8,
      },
      {
        id: '16',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
        title: '2024 Premium Electric Sedan',
        price: '$72,500',
        location: 'San Francisco, CA',
        badge: 'New',
        rating: 4.7,
      },
      {
        id: '17',
        image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
        title: '2023 Luxury Sports Coupe',
        price: '$95,000',
        location: 'Miami, FL',
        badge: 'Premium',
        rating: 4.9,
      },
      {
        id: '18',
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
        title: '2024 Hybrid SUV',
        price: '$58,900',
        originalPrice: '$64,000',
        location: 'Seattle, WA',
        badge: 'Eco Friendly',
        rating: 4.6,
      },
      {
        id: '19',
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
        title: '2023 Luxury Pickup Truck',
        price: '$78,500',
        location: 'Dallas, TX',
        badge: 'Top Rated',
        rating: 4.8,
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
        rating: 4.9,
      },
      {
        id: '20',
        image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
        title: 'Luxury Penthouse Suite',
        price: '$3.2M',
        location: 'New York, NY',
        badge: 'Premium',
        rating: 5.0,
      },
      {
        id: '21',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
        title: 'Modern Family Home',
        price: '$1.8M',
        location: 'Los Angeles, CA',
        badge: 'Hot Deal',
        rating: 4.7,
      },
      {
        id: '22',
        image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        title: 'Beachfront Condo',
        price: '$1.2M',
        location: 'San Diego, CA',
        badge: 'New',
        rating: 4.8,
      },
      {
        id: '23',
        image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&q=80',
        title: 'Luxury Mountain Retreat',
        price: '$2.9M',
        location: 'Aspen, CO',
        badge: 'Exclusive',
        rating: 4.9,
      },
      {
        id: '24',
        image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
        title: 'Downtown Loft Apartment',
        price: '$950K',
        location: 'Chicago, IL',
        badge: 'Trending',
        rating: 4.6,
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
        rating: 4.9,
      },
      {
        id: '4',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        title: 'Pro Wireless ANC Headphones',
        price: '$299.00',
        originalPrice: '$349.00',
        location: 'San Francisco, CA',
        badge: 'Top Seller',
        rating: 4.8,
      },
      {
        id: '5',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
        title: 'Lumix X1 Mirrorless Camera',
        price: '$1,499.00',
        location: 'Seattle, WA',
        badge: 'Premium',
        rating: 4.7,
      },
      {
        id: '25',
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
        title: '34" Curved UltraWide Monitor',
        price: '$549.00',
        location: 'Denver, CO',
        badge: 'New',
        rating: 4.8,
      },
      {
        id: '26',
        image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=80',
        title: 'Tactile RGB Gaming Keyboard',
        price: '$159.00',
        location: 'Las Vegas, NV',
        badge: 'Popular',
        rating: 4.6,
      },
      {
        id: '27',
        image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',
        title: 'Aura Smart Voice Assistant',
        price: '$89.00',
        originalPrice: '$129.00',
        location: 'Chicago, IL',
        badge: 'Sale',
        rating: 4.5,
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
        rating: 4.7,
      },
      {
        id: '13',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
        title: 'Organic Farm Fresh Produce',
        price: '$45.99',
        location: 'Sacramento, CA',
        badge: 'Fresh',
        rating: 4.8,
      },
      {
        id: '28',
        image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
        title: 'Premium Organic Meat Selection',
        price: '$125.00',
        location: 'Austin, TX',
        badge: 'Premium',
        rating: 4.9,
      },
      {
        id: '29',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
        title: 'Fresh Seafood Collection',
        price: '$95.00',
        location: 'Boston, MA',
        badge: 'Daily Fresh',
        rating: 4.8,
      },
      {
        id: '30',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
        title: 'Artisan Bakery Bundle',
        price: '$35.99',
        location: 'Portland, OR',
        badge: 'Fresh Baked',
        rating: 4.7,
      },
      {
        id: '31',
        image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
        title: 'Organic Dairy Products Pack',
        price: '$42.99',
        location: 'Seattle, WA',
        badge: 'Organic',
        rating: 4.6,
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
        rating: 4.8,
      },
      {
        id: '32',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
        title: 'Luxury Designer Handbag',
        price: '$899.00',
        location: 'Los Angeles, CA',
        badge: 'Premium',
        rating: 4.9,
      },
      {
        id: '33',
        image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80',
        title: 'Premium Leather Jacket',
        price: '$599.00',
        originalPrice: '$799.00',
        location: 'Miami, FL',
        badge: 'Sale',
        rating: 4.7,
      },
      {
        id: '34',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
        title: 'Designer Sunglasses Collection',
        price: '$249.00',
        location: 'San Francisco, CA',
        badge: 'New',
        rating: 4.6,
      },
      {
        id: '35',
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
        title: 'Premium Watch Collection',
        price: '$1,299.00',
        location: 'New York, NY',
        badge: 'Luxury',
        rating: 4.9,
      },
      {
        id: '36',
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80',
        title: 'Designer Footwear Set',
        price: '$449.00',
        location: 'Chicago, IL',
        badge: 'Popular',
        rating: 4.8,
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
        rating: 4.8,
      },
      {
        id: '37',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
        title: 'Premium Sofa Collection',
        price: '$1,899.00',
        location: 'Los Angeles, CA',
        badge: 'Comfort',
        rating: 4.9,
      },
      {
        id: '38',
        image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80',
        title: 'Designer Dining Table Set',
        price: '$1,499.00',
        originalPrice: '$1,899.00',
        location: 'Miami, FL',
        badge: 'Sale',
        rating: 4.7,
      },
      {
        id: '39',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
        title: 'Luxury Bedroom Set',
        price: '$3,299.00',
        location: 'New York, NY',
        badge: 'Premium',
        rating: 4.9,
      },
      {
        id: '40',
        image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80',
        title: 'Modern Office Desk Setup',
        price: '$899.00',
        location: 'Seattle, WA',
        badge: 'Ergonomic',
        rating: 4.6,
      },
      {
        id: '41',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
        title: 'Premium Coffee Table',
        price: '$649.00',
        location: 'Denver, CO',
        badge: 'New',
        rating: 4.8,
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
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mint/30 to-transparent"></div>
            <div className="inline-flex items-center gap-2 bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-xs font-bold border border-mint/20 shadow-sm">
              <span className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse"></span>
              CATEGORIES
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mint/30 to-transparent"></div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Shop by{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-mint to-mint-dark bg-clip-text text-transparent">
                  Category
                </span>
                <span className="absolute bottom-1.5 left-0 right-0 h-2.5 bg-mint/20 -z-0 transform -skew-x-12"></span>
              </span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Browse products from your favorite categories
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Categories */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 space-y-2 shadow-xl border border-mint/20 sticky top-8">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-mint/10 rounded-xl flex items-center justify-center">
                  <span className="text-xl">📂</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Categories</h3>
              </div>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-300 font-medium group ${
                    selectedCategory.id === category.id
                      ? 'bg-gradient-to-r from-mint to-mint-dark text-white shadow-xl scale-105 border-2 border-mint'
                      : 'text-gray-700 hover:bg-mint/5 hover:scale-102 border-2 border-transparent hover:border-mint/20'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-2xl transition-transform duration-300 ${selectedCategory.id === category.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {category.icon}
                    </span>
                    <span className="font-semibold flex-1">{category.name}</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                      selectedCategory.id === category.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-mint/10 text-mint-dark'
                    }`}>
                      {category.products.length}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side - Products */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedCategory.name}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span>{selectedCategory.products.length} products available</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span className="text-mint font-medium">All verified</span>
                </p>
              </div>
              <Link
                href={`/${selectedCategory.id === 'real-estate' ? 'real-estate' : selectedCategory.id}`}
                className="inline-flex items-center space-x-2 group bg-white border-2 border-mint/30 text-mint-dark px-5 py-2.5 rounded-xl font-semibold hover:bg-mint hover:text-white hover:border-mint transition-all duration-300 shadow-md hover:shadow-xl"
              >
                <span>View All</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedCategory.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group border border-gray-100 hover:border-mint/30 hover:-translate-y-1"
                >
                  {/* Image */}
                  <Link href={`/product/${product.id}`} className="block relative h-48 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {product.badge && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-mint text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl backdrop-blur-sm">
                          {product.badge}
                        </span>
                      </div>
                    )}
                    {product.originalPrice && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl">
                          Sale
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="p-5">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-mint transition-colors line-clamp-2 min-h-[3.5rem]">
                        {product.title}
                      </h3>
                    </Link>
                    
                    {/* Rating */}
                    {product.rating && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-600 font-medium">({product.rating})</span>
                      </div>
                    )}
                    
                    {/* Price */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl font-bold text-mint">{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">{product.originalPrice}</span>
                      )}
                    </div>
                    
                    {/* Location */}
                    <p className="text-xs text-gray-600 mb-4 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {product.location}
                    </p>
                    
                    {/* Button */}
                    <Link
                      href={`/product/${product.id}`}
                      className="block w-full bg-gradient-to-r from-mint to-mint-dark text-white py-3 rounded-xl font-bold hover:from-mint-dark hover:to-mint transition-all shadow-lg hover:shadow-xl text-center text-sm group/btn"
                    >
                      <span className="flex items-center justify-center gap-2">
                        View Details
                        <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
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
