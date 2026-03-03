'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import Pagination from '@/components/Pagination';

const properties = [
  {
    id: 're1',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    title: 'Waterfront Modern Villa',
    category: 'LUXURY HOMES',
    price: '$2.4M',
    rating: 4.9,
    badge: 'NEW LISTING',
    badgeColor: 'mint' as const,
  },
  {
    id: 're2',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    title: 'Downtown Luxury Penthouse',
    category: 'CONDOMINIUMS',
    price: '$1.8M',
    rating: 4.8,
    badge: 'TOP SELLER',
    badgeColor: 'mint' as const,
  },
  {
    id: 're3',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    title: 'Suburban Family Home',
    category: 'SINGLE FAMILY',
    price: '$650,000',
    rating: 4.7,
    badge: null,
  },
  {
    id: 're4',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    title: 'Beachfront Condo',
    category: 'BEACH PROPERTIES',
    price: '$950,000',
    rating: 4.9,
    badge: 'VERIFIED MINT',
    badgeColor: 'mint' as const,
  },
  {
    id: 're5',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    title: 'Mountain View Estate',
    category: 'ESTATES',
    price: '$3.2M',
    rating: 4.8,
    badge: 'PREMIUM',
    badgeColor: 'blue' as const,
  },
  {
    id: 're6',
    image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&q=80',
    title: 'Modern Townhouse',
    category: 'TOWNHOUSES',
    price: '$425,000',
    rating: 4.6,
    badge: null,
  },
  {
    id: 're7',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    title: 'Luxury Apartment Complex',
    category: 'INVESTMENT',
    price: '$5.5M',
    rating: 4.9,
    badge: 'BESTSELLER',
    badgeColor: 'mint' as const,
  },
  {
    id: 're8',
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    title: 'Countryside Farmhouse',
    category: 'FARMS',
    price: '$1.2M',
    rating: 4.7,
    badge: null,
  },
  {
    id: 're9',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
    title: 'Urban Loft Apartment',
    category: 'LOFTS',
    price: '$380,000',
    rating: 4.5,
    badge: 'SALE 15%',
    badgeColor: 'red' as const,
  },
];

export default function RealEstatePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const itemsPerPage = 9;
  const totalPages = Math.ceil(properties.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = properties.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-mint">Home</Link></li>
            <li>/</li>
            <li className="text-gray-800">Real Estate</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Real Estate Listings</h1>
          <p className="text-gray-600">{properties.length} Properties Available</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <FilterSidebar category="real-estate" />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and View Options */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, properties.length)} of {properties.length} properties
              </p>
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-mint focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentProducts.map((property) => (
                <ProductCard key={property.id} {...property} />
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
