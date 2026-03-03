'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import Pagination from '@/components/Pagination';

const groceryProducts = [
  {
    id: 'g1',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',
    title: 'Organic Honeycrisp Apples',
    category: 'FRUITS',
    price: '$4.99',
    rating: 4.8,
    badge: 'ORGANIC',
    badgeColor: 'mint' as const,
  },
  {
    id: 'g2',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    title: 'Artisanal Sourdough Bread',
    category: 'BAKERY',
    price: '$6.50',
    rating: 4.9,
    badge: 'BESTSELLER',
    badgeColor: 'mint' as const,
  },
  {
    id: 'g3',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80',
    title: 'Fresh Tuscan Kale',
    category: 'VEGETABLES',
    price: '$3.25',
    rating: 4.7,
    badge: 'ORGANIC',
    badgeColor: 'mint' as const,
  },
  {
    id: 'g4',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80',
    title: 'Extra Virgin Olive Oil',
    category: 'PANTRY STAPLES',
    price: '$14.99',
    rating: 4.9,
    badge: null,
  },
  {
    id: 'g5',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&q=80',
    title: 'Heirloom Carrots',
    category: 'VEGETABLES',
    price: '$3.50',
    rating: 4.6,
    badge: 'ORGANIC',
    badgeColor: 'mint' as const,
  },
  {
    id: 'g6',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80',
    title: 'Premium Strawberries',
    category: 'FRUITS',
    price: '$5.99',
    rating: 4.8,
    badge: 'BESTSELLER',
    badgeColor: 'mint' as const,
  },
  {
    id: 'g7',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
    title: 'Whole Organic Milk',
    category: 'DAIRY & EGGS',
    price: '$3.49',
    rating: 4.7,
    badge: 'ORGANIC',
    badgeColor: 'mint' as const,
  },
  {
    id: 'g8',
    image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&q=80',
    title: 'Free-Range Brown Eggs',
    category: 'DAIRY & EGGS',
    price: '$4.25',
    originalPrice: '$4.99',
    rating: 4.9,
    badge: 'SALE 15%',
    badgeColor: 'red' as const,
  },
  {
    id: 'g9',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    title: 'Creamy Greek Yogurt',
    category: 'DAIRY & EGGS',
    price: '$2.80',
    rating: 4.8,
    badge: null,
  },
  {
    id: 'g10',
    image: 'https://images.unsplash.com/photo-1618164436269-44739342d845?w=800&q=80',
    title: 'Aged Sharp Cheddar Cheese',
    category: 'DAIRY & EGGS',
    price: '$5.50',
    rating: 4.9,
    badge: 'BESTSELLER',
    badgeColor: 'mint' as const,
  },
  {
    id: 'g11',
    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80',
    title: 'Grass-Fed Salted Butter',
    category: 'DAIRY & EGGS',
    price: '$4.10',
    rating: 4.7,
    badge: null,
  },
  {
    id: 'g12',
    image: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&q=80',
    title: 'Unsweetened Almond Milk',
    category: 'DAIRY ALTERNATIVE',
    price: '$3.95',
    rating: 4.6,
    badge: null,
  },
  {
    id: 'g13',
    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80',
    title: 'Low-Fat Cottage Cheese',
    category: 'DAIRY & EGGS',
    price: '$2.49',
    rating: 4.5,
    badge: null,
  },
  {
    id: 'g14',
    image: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800&q=80',
    title: 'Heavy Whipping Cream',
    category: 'DAIRY & EGGS',
    price: '$3.15',
    rating: 4.8,
    badge: null,
  },
  {
    id: 'g15',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    title: 'Organic Baby Spinach',
    category: 'VEGETABLES',
    price: '$3.99',
    rating: 4.7,
    badge: 'ORGANIC',
    badgeColor: 'mint' as const,
  },
  {
    id: 'g16',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',
    title: 'Fresh Blueberries',
    category: 'FRUITS',
    price: '$6.99',
    rating: 4.9,
    badge: 'BESTSELLER',
    badgeColor: 'mint' as const,
  },
  {
    id: 'g17',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    title: 'Whole Grain Bread',
    category: 'BAKERY',
    price: '$4.50',
    rating: 4.6,
    badge: null,
  },
  {
    id: 'g18',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80',
    title: 'Organic Broccoli',
    category: 'VEGETABLES',
    price: '$2.99',
    rating: 4.5,
    badge: 'ORGANIC',
    badgeColor: 'mint' as const,
  },
];

export default function GroceriesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const itemsPerPage = 9;
  const totalPages = Math.ceil(groceryProducts.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = groceryProducts.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><a href="/" className="hover:text-mint">Home</a></li>
            <li>/</li>
            <li className="text-gray-800">Groceries</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Groceries</h1>
          <p className="text-gray-600">{groceryProducts.length} Items Found</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <FilterSidebar category="groceries" />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and View Options */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, groceryProducts.length)} of {groceryProducts.length} products
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
