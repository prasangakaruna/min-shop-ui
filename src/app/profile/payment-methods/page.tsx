'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  isDefault: boolean;
  paypalEmail?: string;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      cardNumber: '4242',
      cardHolder: 'John Doe',
      expiryDate: '12/25',
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      cardNumber: '8888',
      cardHolder: 'John Doe',
      expiryDate: '06/26',
      isDefault: false,
    },
    {
      id: '3',
      type: 'paypal',
      paypalEmail: 'john.doe@example.com',
      isDefault: false,
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [formType, setFormType] = useState<'card' | 'paypal'>('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    paypalEmail: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMethod: PaymentMethod = formType === 'card'
      ? {
          id: Date.now().toString(),
          type: 'card',
          cardNumber: formData.cardNumber.slice(-4),
          cardHolder: formData.cardHolder,
          expiryDate: formData.expiryDate,
          isDefault: methods.length === 0,
        }
      : {
          id: Date.now().toString(),
          type: 'paypal',
          paypalEmail: formData.paypalEmail,
          isDefault: methods.length === 0,
        };
    setMethods([...methods, newMethod]);
    setIsAdding(false);
    setFormData({
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      paypalEmail: '',
    });
  };

  const handleDelete = (id: string) => {
    setMethods(methods.filter(method => method.id !== id));
  };

  const setDefault = (id: string) => {
    setMethods(methods.map(method => ({
      ...method,
      isDefault: method.id === id,
    })));
  };

  const getCardIcon = (cardNumber: string) => {
    if (cardNumber.startsWith('4')) return 'Visa';
    if (cardNumber.startsWith('5')) return 'Mastercard';
    if (cardNumber.startsWith('3')) return 'Amex';
    return 'Card';
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
            <li><Link href="/profile" className="hover:text-mint">Profile</Link></li>
            <li>/</li>
            <li className="text-gray-800">Payment Methods</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Payment Methods</h1>
            <p className="text-gray-600">Manage your payment options</p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-colors"
            >
              + Add Payment Method
            </button>
          )}
        </div>

        {/* Add Payment Method Form */}
        {isAdding && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Payment Method</h2>
            
            {/* Payment Type Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setFormType('card')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  formType === 'card'
                    ? 'border-mint bg-mint/10'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="font-medium">Credit Card</span>
                </div>
              </button>
              <button
                onClick={() => setFormType('paypal')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  formType === 'paypal'
                    ? 'border-mint bg-mint/10'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.533zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.032.15-.054.22-.367 1.533-1.678 3.05-4.06 3.05h-2.19c-.26 0-.51.19-.578.45l-.97 6.52h3.346c.26 0 .51-.19.578-.45l.97-6.52c.068-.26-.05-.45-.31-.45h-1.09c2.282 0 3.693-1.515 4.06-3.05.022-.07.04-.144.054-.22a3.349 3.349 0 0 0-.608.54z"/>
                  </svg>
                  <span className="font-medium">PayPal</span>
                </div>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {formType === 'card' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      required
                      maxLength={19}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      name="cardHolder"
                      value={formData.cardHolder}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        required
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        required
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PayPal Email</label>
                  <input
                    type="email"
                    name="paypalEmail"
                    value={formData.paypalEmail}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint focus:border-transparent"
                  />
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-6 py-3 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-colors"
                >
                  Add Payment Method
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setFormData({
                      cardNumber: '',
                      cardHolder: '',
                      expiryDate: '',
                      cvv: '',
                      paypalEmail: '',
                    });
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payment Methods List */}
        <div className="space-y-4">
          {methods.map((method) => (
            <div key={method.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-mint/10 rounded-lg flex items-center justify-center">
                    {method.type === 'card' ? (
                      <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.533zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.032.15-.054.22-.367 1.533-1.678 3.05-4.06 3.05h-2.19c-.26 0-.51.19-.578.45l-.97 6.52h3.346c.26 0 .51-.19.578-.45l.97-6.52c.068-.26-.05-.45-.31-.45h-1.09c2.282 0 3.693-1.515 4.06-3.05.022-.07.04-.144.054-.22a3.349 3.349 0 0 0-.608.54z"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-bold text-gray-800">
                        {method.type === 'card' 
                          ? `${getCardIcon(method.cardNumber || '')} •••• ${method.cardNumber}`
                          : `PayPal • ${method.paypalEmail}`
                        }
                      </h3>
                      {method.isDefault && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    {method.type === 'card' && (
                      <p className="text-sm text-gray-600">
                        {method.cardHolder} • Expires {method.expiryDate}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => setDefault(method.id)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {methods.length === 0 && !isAdding && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No payment methods</h3>
            <p className="text-gray-600 mb-6">Add a payment method to make checkout faster.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-block px-6 py-3 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-colors"
            >
              Add Payment Method
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
