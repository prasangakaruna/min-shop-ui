'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getStorefrontCart, getImageDisplayUrl, type StorefrontCart } from '@/lib/api';

function PaymentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeIdParam = searchParams?.get('store_id');
  const storeId = storeIdParam ? parseInt(storeIdParam, 10) : NaN;
  const effectiveStoreId = !isNaN(storeId) && storeId > 0 ? storeId : null;

  const { status } = useSession();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      const returnUrl = `/checkout/payment${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
      router.replace(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [status, router, searchParams]);

  useEffect(() => {
    if (status !== 'authenticated' || effectiveStoreId == null) {
      setCartLoading(false);
      setCart(null);
      return;
    }
    setCartLoading(true);
    setCartError(null);
    getStorefrontCart(effectiveStoreId)
      .then(setCart)
      .catch((e) => {
        setCartError(e instanceof Error ? e.message : 'Failed to load cart');
        setCart(null);
      })
      .finally(() => setCartLoading(false));
  }, [status, effectiveStoreId]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-mint border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">{status === 'unauthenticated' ? 'Redirecting to sign in...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiryDate(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      // Redirect to confirmation page (include store_id so confirmation can fetch order)
      const params = new URLSearchParams({ orderId: 'ORD-' + Date.now() });
      if (effectiveStoreId != null) params.set('store_id', String(effectiveStoreId));
      router.push('/checkout/confirmation?' + params.toString());
    }, 2000);
  };

  const lines = cart?.lines ?? [];
  const subtotal = lines.reduce((sum, l) => sum + parseFloat(l.price) * l.quantity, 0);
  const subtotalFormatted = `$${subtotal.toFixed(2)}`;
  const shipping = 0;
  const tax = 0;
  const total = subtotal + shipping + tax;
  const totalFormatted = `$${total.toFixed(2)}`;

  const showOrderSummary = status === 'authenticated' && !cartLoading && effectiveStoreId != null;
  const orderSummaryEmpty = showOrderSummary && (cartError != null || (cart != null && lines.length === 0));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-mint text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-600">Cart</span>
            </div>
            <div className="w-16 h-0.5 bg-mint"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-mint text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Payment</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-400">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-mint transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link href="/cart" className="hover:text-mint transition-colors">Cart</Link></li>
            <li>/</li>
            <li className="text-gray-800 font-medium">Payment</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Payment Method</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure Payment</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-5 border-2 rounded-xl transition-all duration-200 ${
                    paymentMethod === 'card'
                      ? 'border-mint bg-mint/10 shadow-md scale-105'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <svg className={`w-8 h-8 ${paymentMethod === 'card' ? 'text-mint' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className={`font-semibold ${paymentMethod === 'card' ? 'text-mint' : 'text-gray-700'}`}>Credit Card</span>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-5 border-2 rounded-xl transition-all duration-200 ${
                    paymentMethod === 'paypal'
                      ? 'border-mint bg-mint/10 shadow-md scale-105'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <svg className={`w-8 h-8 ${paymentMethod === 'paypal' ? 'text-blue-600' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.533zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.032.15-.054.22-.367 1.533-1.678 3.05-4.06 3.05h-2.19c-.26 0-.51.19-.578.45l-.97 6.52h3.346c.26 0 .51-.19.578-.45l.97-6.52c.068-.26-.05-.45-.31-.45h-1.09c2.282 0 3.693-1.515 4.06-3.05.022-.07.04-.144.054-.22a3.349 3.349 0 0 0-.608.54z"/>
                    </svg>
                    <span className={`font-semibold ${paymentMethod === 'paypal' ? 'text-blue-600' : 'text-gray-700'}`}>PayPal</span>
                  </div>
                </button>
              </div>

              {paymentMethod === 'card' && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-mint focus:border-mint transition-all text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-mint focus:border-mint transition-all text-gray-900 placeholder:text-gray-400"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                        <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-mint focus:border-mint transition-all text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        CVV
                        <span className="text-xs text-gray-500 font-normal">(3-4 digits)</span>
                      </label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        maxLength={4}
                        required
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-mint focus:border-mint transition-all text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="saveCard"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="w-4 h-4 text-mint border-gray-300 rounded focus:ring-mint"
                    />
                    <label htmlFor="saveCard" className="text-sm text-gray-600 cursor-pointer">
                      Save this card for future purchases
                    </label>
                  </div>
                </form>
              )}

              {paymentMethod === 'paypal' && (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <svg className="w-16 h-16 mx-auto text-blue-600 mb-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.533zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.032.15-.054.22-.367 1.533-1.678 3.05-4.06 3.05h-2.19c-.26 0-.51.19-.578.45l-.97 6.52h3.346c.26 0 .51-.19.578-.45l.97-6.52c.068-.26-.05-.45-.31-.45h-1.09c2.282 0 3.693-1.515 4.06-3.05.022-.07.04-.144.054-.22a3.349 3.349 0 0 0-.608.54z"/>
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-6 text-lg">You will be redirected to PayPal to complete your payment securely</p>
                  <button className="bg-blue-600 text-white px-10 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl">
                    Continue with PayPal
                  </button>
                </div>
              )}
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Billing Address</h2>
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    className="w-4 h-4 text-mint border-gray-300 rounded focus:ring-mint"
                  />
                  <span className="text-sm text-gray-700">Same as shipping address</span>
                </label>
              </div>
              {!billingSameAsShipping && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-mint focus:border-mint transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-mint focus:border-mint transition-all text-gray-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-mint focus:border-mint transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-mint focus:border-mint transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-mint focus:border-mint transition-all text-gray-900"
                    />
                  </div>
                </div>
              )}
              {billingSameAsShipping && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-600">Billing address will be the same as your shipping address</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {cartLoading ? (
                <div className="space-y-4 mb-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                      <div className="w-20 h-20 rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : orderSummaryEmpty ? (
                <div className="py-6 text-center">
                  <p className="text-gray-600 mb-2">{cartError ?? 'Your cart is empty.'}</p>
                  <Link
                    href={effectiveStoreId != null ? `/cart?store_id=${effectiveStoreId}` : '/cart'}
                    className="text-mint font-medium hover:underline"
                  >
                    Back to Cart
                  </Link>
                </div>
              ) : (
                <>
                  {/* Cart Items from API */}
                  <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                    {lines.map((line) => (
                      <div key={line.id} className="flex items-center space-x-3 pb-4 border-b border-gray-100 last:border-0">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 bg-gray-100">
                          {line.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getImageDisplayUrl(line.image_url)}
                              alt={line.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-full flex items-center justify-center text-gray-400 text-xs"
                            style={{ display: line.image_url ? 'none' : 'flex' }}
                          >
                            No image
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate mb-1">{line.title}</p>
                          <p className="text-xs text-gray-500">Quantity: {line.quantity}</p>
                          <p className="text-sm font-bold text-mint mt-1">${(parseFloat(line.price) * line.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="space-y-3 mb-6 pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Subtotal</span>
                      <span className="font-medium">{subtotalFormatted}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Shipping</span>
                      <span className="font-medium">{shipping > 0 ? `$${shipping.toFixed(2)}` : '—'}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Tax</span>
                      <span className="font-medium">{tax > 0 ? `$${tax.toFixed(2)}` : '—'}</span>
                    </div>
                    <div className="border-t-2 border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg text-gray-900">Total</span>
                        <span className="font-bold text-mint text-2xl">{totalFormatted}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={handleSubmit}
                disabled={isProcessing || orderSummaryEmpty || cartLoading}
                className={`w-full bg-gradient-to-r from-mint to-mint-dark text-white py-4 rounded-xl font-bold hover:from-mint-dark hover:to-mint transition-all shadow-lg hover:shadow-xl mb-4 flex items-center justify-center gap-2 ${
                  isProcessing || orderSummaryEmpty || cartLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Complete Payment'
                )}
              </button>
              <Link
                href={effectiveStoreId != null ? `/cart?store_id=${effectiveStoreId}` : '/cart'}
                className="block text-center text-mint hover:text-mint-dark transition-colors font-medium text-sm"
              >
                ← Back to Cart
              </Link>
              
              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>SSL Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Protected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-2 border-mint border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading payment…</p>
          </div>
        </div>
      }
    >
      <PaymentPageInner />
    </Suspense>
  );
}
