'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';

interface TrackingStep {
  status: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  completed: boolean;
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [trackingOrder, setTrackingOrder] = useState<TrackingStep[] | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Sample tracking data
  const sampleTracking: TrackingStep[] = [
    {
      status: 'Order Placed',
      description: 'Your order has been received and confirmed',
      date: 'March 10, 2024',
      time: '10:30 AM',
      completed: true,
    },
    {
      status: 'Processing',
      description: 'Your order is being prepared for shipment',
      date: 'March 10, 2024',
      time: '2:15 PM',
      completed: true,
    },
    {
      status: 'Shipped',
      description: 'Your order has been shipped',
      date: 'March 11, 2024',
      time: '9:00 AM',
      location: 'New York Distribution Center',
      completed: true,
    },
    {
      status: 'In Transit',
      description: 'Your order is on the way',
      date: 'March 12, 2024',
      time: '3:45 PM',
      location: 'Philadelphia, PA',
      completed: true,
    },
    {
      status: 'Out for Delivery',
      description: 'Your order is out for delivery',
      date: 'March 13, 2024',
      time: '8:00 AM',
      location: 'Local Delivery Hub',
      completed: true,
    },
    {
      status: 'Delivered',
      description: 'Your order has been delivered',
      date: 'March 13, 2024',
      time: '2:30 PM',
      location: '123 Main Street, New York, NY 10001',
      completed: true,
    },
  ];

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      // Simulate tracking lookup
      setTrackingOrder(sampleTracking);
      setOrderDetails({
        id: orderId,
        total: '$458.98',
        estimatedDelivery: 'March 13, 2024',
        carrier: 'FedEx',
        trackingNumber: 'FX1234567890',
        items: [
          {
            name: 'Bluetooth Portable Speaker',
            quantity: 2,
            price: '$79.99',
          },
          {
            name: 'Wireless Charging Pad',
            quantity: 1,
            price: '$39.99',
          },
        ],
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 animate-fade-in">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-mint transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link href="/profile" className="hover:text-mint transition-colors">Profile</Link></li>
            <li>/</li>
            <li className="text-gray-800 font-medium">Track Order</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your order number to track its status</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Track Order Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Track Order</h2>
              <form onSubmit={handleTrackOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order Number
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g., ORD-2024-001234"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-mint text-white py-3 rounded-lg font-medium hover:bg-mint-dark transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Track Order</span>
                </button>
              </form>

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Quick Links</p>
                <div className="space-y-2">
                  <Link
                    href="/profile/orders"
                    className="block px-4 py-2 text-gray-700 hover:bg-mint/10 hover:text-mint rounded-lg transition-colors text-sm"
                  >
                    View All Orders
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-mint/10 hover:text-mint rounded-lg transition-colors text-sm"
                  >
                    Back to Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Results */}
          <div className="lg:col-span-2 space-y-6">
            {orderDetails && trackingOrder ? (
              <>
                {/* Order Summary */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-slide-up">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Order #{orderDetails.id}
                      </h2>
                      <p className="text-gray-600">Tracking Number: {orderDetails.trackingNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-mint">{orderDetails.total}</p>
                      <p className="text-sm text-gray-600">Estimated Delivery</p>
                      <p className="text-sm font-medium text-gray-800">{orderDetails.estimatedDelivery}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Carrier</p>
                      <p className="font-semibold text-gray-800">{orderDetails.carrier}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <p className="font-semibold text-green-600">Delivered</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Order Items</h3>
                    <div className="space-y-2">
                      {orderDetails.items.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">{item.name} × {item.quantity}</span>
                          <span className="font-semibold text-gray-800">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tracking Timeline */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-slide-up">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Tracking Timeline</h2>
                  
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-mint"></div>
                    
                    {/* Timeline Steps */}
                    <div className="space-y-6">
                      {trackingOrder.map((step, index) => (
                        <div key={index} className="relative flex items-start space-x-4">
                          {/* Timeline Dot */}
                          <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                            step.completed 
                              ? 'bg-mint text-white shadow-lg' 
                              : 'bg-gray-200 text-gray-400'
                          }`}>
                            {step.completed ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-current"></div>
                            )}
                          </div>
                          
                          {/* Step Content */}
                          <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className={`font-bold text-lg ${
                                  step.completed ? 'text-gray-800' : 'text-gray-400'
                                }`}>
                                  {step.status}
                                </h3>
                                <p className={`text-sm mt-1 ${
                                  step.completed ? 'text-gray-600' : 'text-gray-400'
                                }`}>
                                  {step.description}
                                </p>
                                {step.location && (
                                  <p className="text-sm text-gray-500 mt-1 flex items-center space-x-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{step.location}</span>
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-medium ${
                                  step.completed ? 'text-gray-700' : 'text-gray-400'
                                }`}>
                                  {step.date}
                                </p>
                                <p className={`text-xs ${
                                  step.completed ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  {step.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-slide-up">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Delivery Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Shipping Address</p>
                      <p className="text-gray-600">
                        123 Main Street<br />
                        New York, NY 10001<br />
                        United States
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Contact</p>
                      <p className="text-gray-600">
                        Phone: +1 (555) 123-4567<br />
                        Email: john.doe@example.com
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center animate-fade-in">
                <div className="w-20 h-20 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Track Your Order</h3>
                <p className="text-gray-600 mb-6">
                  Enter your order number in the form to view real-time tracking information
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Order number can be found in your order confirmation email</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
