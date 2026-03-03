'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import Pagination from '@/components/Pagination';

const vehicles = [
  {
    id: 'v1',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
    title: '2024 Electric Signature SUV',
    category: 'ELECTRIC VEHICLES',
    price: '$84,900',
    originalPrice: '$89,900',
    rating: 4.9,
    badge: 'VERIFIED MINT',
    badgeColor: 'mint' as const,
  },
  {
    id: 'v2',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    title: 'Luxury Sports Sedan 2023',
    category: 'LUXURY CARS',
    price: '$65,500',
    rating: 4.8,
    badge: 'TOP SELLER',
    badgeColor: 'mint' as const,
  },
  {
    id: 'v3',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
    title: 'Premium Pickup Truck 2024',
    category: 'TRUCKS',
    price: '$52,000',
    rating: 4.7,
    badge: null,
  },
  {
    id: 'v4',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
    title: 'Compact Hybrid Hatchback',
    category: 'HYBRID',
    price: '$28,900',
    rating: 4.6,
    badge: 'ECO FRIENDLY',
    badgeColor: 'mint' as const,
  },
  {
    id: 'v5',
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80',
    title: 'Classic Convertible Roadster',
    category: 'CONVERTIBLES',
    price: '$45,000',
    rating: 4.9,
    badge: 'NEW LISTING',
    badgeColor: 'blue' as const,
  },
  {
    id: 'v6',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
    title: 'Family Minivan 2024',
    category: 'MINIVANS',
    price: '$38,500',
    rating: 4.5,
    badge: null,
  },
  {
    id: 'v7',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80',
    title: 'Performance Sports Coupe',
    category: 'SPORTS CARS',
    price: '$72,000',
    rating: 4.8,
    badge: 'BESTSELLER',
    badgeColor: 'mint' as const,
  },
  {
    id: 'v8',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
    title: 'Luxury SUV 2024',
    category: 'SUVS',
    price: '$95,000',
    rating: 4.9,
    badge: 'VERIFIED MINT',
    badgeColor: 'mint' as const,
  },
  {
    id: 'v9',
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80',
    title: 'Electric Compact Car',
    category: 'ELECTRIC VEHICLES',
    price: '$32,000',
    rating: 4.7,
    badge: 'SALE 10%',
    badgeColor: 'red' as const,
  },
];

export default function VehiclesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const itemsPerPage = 9;
  const totalPages = Math.ceil(vehicles.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = vehicles.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-mint">Home</Link></li>
            <li>/</li>
            <li className="text-gray-800">Vehicles</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Browse Vehicles</h1>
          <p className="text-gray-600">{vehicles.length} Vehicles Available</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <FilterSidebar category="vehicles" />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and View Options */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, vehicles.length)} of {vehicles.length} vehicles
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
              {currentProducts.map((vehicle) => (
                <ProductCard key={vehicle.id} {...vehicle} />
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
