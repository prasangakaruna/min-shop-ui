'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import Pagination from '@/components/Pagination';

// Mock search results - in a real app, this would come from an API
const allProducts = [
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
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
    title: '2024 Electric Signature SUV',
    category: 'VEHICLES',
    price: '$84,900',
    rating: 4.8,
    badge: 'VERIFIED MINT',
    badgeColor: 'mint' as const,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    title: 'Waterfront Modern Villa',
    category: 'REAL ESTATE',
    price: '$2.4M',
    rating: 4.9,
    badge: 'NEW LISTING',
    badgeColor: 'blue' as const,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    title: 'Lumix X1 Mirrorless Camera',
    category: 'CAMERAS & PHOTOGRAPHY',
    price: '$1,499.00',
    rating: 4.7,
    badge: null,
  },
  {
    id: '5',
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
    id: '6',
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=80',
    title: 'Tactile RGB Gaming Keyboard',
    category: 'GAMING',
    price: '$159.00',
    rating: 4.8,
    badge: null,
  },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Filter products based on search query and category
  const filteredProducts = allProducts.filter((product) => {
    const matchesQuery = !query || 
      product.title.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !category || product.category.toLowerCase().includes(category.toLowerCase());
    return matchesQuery && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><a href="/" className="hover:text-mint">Home</a></li>
            <li>/</li>
            <li className="text-gray-800">Search Results</li>
          </ol>
        </nav>

        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {query ? `Search Results for "${query}"` : 'Search Results'}
          </h1>
          <p className="text-gray-600">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} found
            {category && ` in ${category}`}
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-24 w-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No results found</h2>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or browse our categories
            </p>
            <a
              href="/products"
              className="inline-block bg-mint text-white px-6 py-3 rounded-lg font-medium hover:bg-mint-dark transition-colors"
            >
              Browse All Products
            </a>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <FilterSidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    image={product.image}
                    title={product.title}
                    category={product.category}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    rating={product.rating}
                    badge={product.badge}
                    badgeColor={product.badgeColor}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading search results...</p>
          </div>
        </main>
      }>
        <SearchContent />
      </Suspense>
      <Footer />
    </div>
  );
}
