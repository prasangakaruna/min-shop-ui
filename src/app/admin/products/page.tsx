'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const products = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      name: 'Pro Wireless ANC Headphones',
      category: 'Electronics',
      price: '$299.00',
      stock: 45,
      status: 'Active',
      sales: 1247,
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
      name: 'Lumix X1 Mirrorless Camera',
      category: 'Electronics',
      price: '$1,499.00',
      stock: 12,
      status: 'Active',
      sales: 892,
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',
      name: 'Organic Honeycrisp Apples',
      category: 'Groceries',
      price: '$4.99',
      stock: 0,
      status: 'Out of Stock',
      sales: 654,
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
      name: '2024 Electric Signature SUV',
      category: 'Vehicles',
      price: '$84,900',
      stock: 3,
      status: 'Active',
      sales: 23,
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      name: 'Waterfront Modern Villa',
      category: 'Real Estate',
      price: '$2.4M',
      stock: 1,
      status: 'Active',
      sales: 1,
    },
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Products Management</h1>
          <p className="text-gray-600">Manage your product inventory and listings</p>
        </div>
        <Link
          href="/admin/products/add"
          className="px-6 py-3 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="block w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint"
            />
          </div>
          <select className="border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-mint focus:border-mint">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Groceries</option>
            <option>Vehicles</option>
            <option>Real Estate</option>
          </select>
          <select className="border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-mint focus:border-mint">
            <option>All Status</option>
            <option>Active</option>
            <option>Out of Stock</option>
            <option>Draft</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sales</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{product.name}</div>
                        <div className="text-xs text-gray-500">ID: {product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-800">{product.price}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-yellow-600' : 'text-gray-700'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      product.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{product.sales}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="px-3 py-1.5 bg-mint/10 text-mint rounded-lg text-sm font-medium hover:bg-mint/20 transition-colors"
                      >
                        Edit
                      </Link>
                      <button className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
