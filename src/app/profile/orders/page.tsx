'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';

export default function OrdersPage() {
  const [filter, setFilter] = useState('all');

  const orders = [
    {
      id: 'ORD-2024-001234',
      date: 'March 15, 2024',
      status: 'Delivered',
      statusColor: 'bg-green-100 text-green-800',
      total: '$299.00',
      items: [
        {
          id: '1',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
          name: 'Pro Wireless ANC Headphones',
          quantity: 1,
          price: '$299.00',
        },
      ],
    },
    {
      id: 'ORD-2024-001189',
      date: 'March 10, 2024',
      status: 'Shipped',
      statusColor: 'bg-blue-100 text-blue-800',
      total: '$458.98',
      items: [
        {
          id: '2',
          image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
          name: 'Bluetooth Portable Speaker',
          quantity: 2,
          price: '$79.99',
        },
        {
          id: '3',
          image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
          name: 'Wireless Charging Pad',
          quantity: 1,
          price: '$39.99',
        },
      ],
    },
    {
      id: 'ORD-2024-001045',
      date: 'March 5, 2024',
      status: 'Processing',
      statusColor: 'bg-yellow-100 text-yellow-800',
      total: '$89.00',
      items: [
        {
          id: '4',
          image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',
          name: 'Aura Smart Voice Assistant',
          quantity: 1,
          price: '$89.00',
        },
      ],
    },
    {
      id: 'ORD-2024-000892',
      date: 'February 28, 2024',
      status: 'Delivered',
      statusColor: 'bg-green-100 text-green-800',
      total: '$159.00',
      items: [
        {
          id: '5',
          image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=80',
          name: 'Tactile RGB Gaming Keyboard',
          quantity: 1,
          price: '$159.00',
        },
      ],
    },
    {
      id: 'ORD-2024-000756',
      date: 'February 20, 2024',
      status: 'Cancelled',
      statusColor: 'bg-red-100 text-red-800',
      total: '$549.00',
      items: [
        {
          id: '6',
          image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
          name: '34" Curved UltraWide Monitor',
          quantity: 1,
          price: '$549.00',
        },
      ],
    },
  ];

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === filter.toLowerCase());

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
            <li className="text-gray-800">My Orders</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Orders</h1>
          <p className="text-gray-600">View and manage your order history</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'delivered', 'shipped', 'processing', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-mint text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                {/* Order Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">Order #{order.id}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Placed on {order.date}</p>
                  </div>
                  <div className="mt-4 md:mt-0 text-right">
                    <p className="text-lg font-bold text-mint">{order.total}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <Link
                    href={`/order/${order.id}`}
                    className="px-4 py-2 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-colors"
                  >
                    View Details
                  </Link>
                  {order.status === 'Delivered' && (
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                      Reorder
                    </button>
                  )}
                  {order.status === 'Processing' && (
                    <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors">
                      Cancel Order
                    </button>
                  )}
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                    Download Invoice
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No orders found</h3>
              <p className="text-gray-600 mb-6">You don&apos;t have any orders in this category yet.</p>
              <Link
                href="/products"
                className="inline-block px-6 py-3 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
