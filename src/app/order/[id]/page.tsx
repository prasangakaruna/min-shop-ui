'use client';

import React from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const order = {
    id: params.id,
    orderNumber: 'ORD-2024-001234',
    date: 'March 15, 2024',
    status: 'Delivered',
    statusColor: 'text-green-600',
    items: [
      {
        id: '1',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        name: 'Pro Wireless ANC Headphones',
        quantity: 1,
        price: '$299.00',
      },
      {
        id: '2',
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
        name: 'Bluetooth Portable Speaker',
        quantity: 2,
        price: '$79.99',
      },
    ],
    shipping: {
      name: 'John Doe',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      phone: '+1 (555) 123-4567',
    },
    payment: {
      method: 'Credit Card',
      card: '**** **** **** 4242',
    },
    summary: {
      subtotal: '$458.98',
      shipping: '$15.00',
      tax: '$37.47',
      total: '$511.45',
    },
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
            <li><Link href="/orders" className="hover:text-mint">Orders</Link></li>
            <li>/</li>
            <li className="text-gray-800">Order Details</li>
          </ol>
        </nav>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Details</h1>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
              <p className="text-gray-600">Placed on {order.date}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`inline-block px-4 py-2 rounded-full font-medium ${order.statusColor} bg-green-50`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-0">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Shipping Address</h2>
              <div className="text-gray-600">
                <p className="font-medium text-gray-800">{order.shipping.name}</p>
                <p>{order.shipping.address}</p>
                <p>{order.shipping.city}, {order.shipping.state} {order.shipping.zip}</p>
                <p className="mt-2">{order.shipping.phone}</p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Method</h2>
              <div className="text-gray-600">
                <p className="font-medium text-gray-800">{order.payment.method}</p>
                <p>{order.payment.card}</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{order.summary.subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{order.summary.shipping}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{order.summary.tax}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="font-bold text-mint text-xl">{order.summary.total}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-mint text-white py-3 rounded-lg font-medium hover:bg-mint-dark transition-colors">
                  Track Order
                </button>
                <button className="w-full border-2 border-mint text-mint py-3 rounded-lg font-medium hover:bg-mint/10 transition-colors">
                  Download Invoice
                </button>
                <button className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Reorder Items
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
