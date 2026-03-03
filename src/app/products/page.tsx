'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import Pagination from '@/components/Pagination';

const products = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    title: 'Pro Wireless ANC Headphones',
    category: 'AUDIO & HEADPHONES',
    price: '$299.00',
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
    image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',
    title: 'Aura Smart Voice Assistant',
    category: 'SMART HOME',
    price: '$89.00',
    originalPrice: '$129.00',
    rating: 4.5,
    badge: 'NEW ARRIVAL',
    badgeColor: 'blue' as const,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=80',
    title: 'Tactile RGB Gaming Keyboard',
    category: 'GAMING',
    price: '$159.00',
    rating: 4.8,
    badge: null,
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80',
    title: 'Ultra-Sync HDMI 2.1 Cable',
    category: 'CABLES & ADAPTERS',
    price: '$24.99',
    rating: 4.9,
    badge: null,
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    title: '34" Curved UltraWide Monitor',
    category: 'MONITORS',
    price: '$549.00',
    rating: 4.6,
    badge: null,
  },
  {
    id: '7',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    title: 'Wireless Charging Pad',
    category: 'ACCESSORIES',
    price: '$39.99',
    rating: 4.7,
    badge: 'BESTSELLER',
    badgeColor: 'mint' as const,
  },
  {
    id: '8',
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
    title: 'Bluetooth Portable Speaker',
    category: 'AUDIO & HEADPHONES',
    price: '$79.99',
    rating: 4.8,
    badge: null,
  },
  {
    id: '9',
    image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&q=80',
    title: '4K Action Camera',
    category: 'CAMERAS & PHOTOGRAPHY',
    price: '$199.00',
    rating: 4.6,
    badge: 'SALE 15%',
    badgeColor: 'red' as const,
  },
];

export default function ProductsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const itemsPerPage = 9;
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><a href="/" className="hover:text-mint">Home</a></li>
            <li>/</li>
            <li className="text-gray-800">Products</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Products</h1>
          <p className="text-gray-600">1,240 Results</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <FilterSidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and View Options */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, products.length)} of {products.length} products
              </p>
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-mint focus:border-transparent"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="popular">Most Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
