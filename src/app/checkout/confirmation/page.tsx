'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'ORD-2024-001234';

  // Mock order data - in real app, fetch from API using orderId
  const order = {
    id: orderId,
    date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
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
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      phone: '+1 (555) 123-4567',
    },
    payment: {
      method: 'Credit Card',
      last4: '4242',
      total: '$511.45',
    },
    estimatedDelivery: '3-5 business days',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Icon and Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Thank you for your purchase
          </p>
          <p className="text-gray-500">
            Your order has been received and is being processed
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8 mb-8">
          <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Details</h2>
              <p className="text-sm text-gray-600">Order ID: <span className="font-semibold text-gray-900">{order.id}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-semibold text-gray-900">{order.date}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Items Ordered</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-mint text-lg">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Shipping Address */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Shipping Address
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">{order.shipping.name}</p>
                <p>{order.shipping.address}</p>
                <p>{order.shipping.city}, {order.shipping.state} {order.shipping.zip}</p>
                <p className="mt-2">{order.shipping.phone}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Payment Method
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">{order.payment.method}</p>
                <p>•••• •••• •••• {order.payment.last4}</p>
                <p className="mt-2 text-lg font-bold text-mint">Total: {order.payment.total}</p>
              </div>
            </div>
          </div>

          {/* Delivery Estimate */}
          <div className="bg-mint/10 border border-mint/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-mint flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Estimated Delivery</h4>
                <p className="text-gray-700">{order.estimatedDelivery}</p>
                <p className="text-sm text-gray-600 mt-2">You will receive a tracking number via email once your order ships.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href={`/order/${order.id}`}
            className="inline-flex items-center justify-center px-8 py-4 bg-mint text-white rounded-xl font-semibold hover:bg-mint-dark transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Order Details
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-mint text-mint rounded-xl font-semibold hover:bg-mint/10 transition-all shadow-md hover:shadow-lg"
          >
            Continue Shopping
          </Link>
        </div>

        {/* What's Next Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">What's Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Confirmation Email</h4>
              <p className="text-sm text-gray-600">You'll receive an order confirmation email shortly with all the details.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Order Processing</h4>
              <p className="text-sm text-gray-600">We're preparing your order and will notify you when it ships.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Track Your Order</h4>
              <p className="text-sm text-gray-600">Use your order ID to track the status of your shipment.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mint mb-4"></div>
          <p className="text-gray-600">Loading order confirmation...</p>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
