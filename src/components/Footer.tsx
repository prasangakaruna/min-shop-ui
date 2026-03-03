'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Mint Hub Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4 group">
              <div className="w-8 h-8 bg-mint rounded flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-4 h-4 bg-white transform rotate-45"></div>
              </div>
              <span className="text-xl font-bold text-gray-800">Mint Hub</span>
            </Link>
            <p className="text-gray-600 mb-6 leading-relaxed">
              The ultimate destination for buying and selling high-value assets. We ensure every transaction is handled with the care and security you deserve.
            </p>
            <div className="flex space-x-3">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-mint hover:text-white hover:border-mint transition-all duration-200"
                aria-label="Share on social media"
              >
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-mint hover:text-white hover:border-mint transition-all duration-200"
                aria-label="Visit our website"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </a>
            </div>
          </div>

          {/* Marketplace Links */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Marketplace</h3>
            <ul className="space-y-3">
              <li><Link href="/products" className="text-gray-600 hover:text-mint transition-colors text-sm">Browse Vehicles</Link></li>
              <li><Link href="/products" className="text-gray-600 hover:text-mint transition-colors text-sm">Real Estate Listings</Link></li>
              <li><Link href="/products" className="text-gray-600 hover:text-mint transition-colors text-sm">Home Electronics</Link></li>
              <li><Link href="/groceries" className="text-gray-600 hover:text-mint transition-colors text-sm">Groceries</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Resources</h3>
            <ul className="space-y-3">
              <li><Link href="/profile" className="text-gray-600 hover:text-mint transition-colors text-sm">My Account</Link></li>
              <li><Link href="/profile/orders" className="text-gray-600 hover:text-mint transition-colors text-sm">Order History</Link></li>
              <li><Link href="/profile/settings" className="text-gray-600 hover:text-mint transition-colors text-sm">Settings</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-mint transition-colors text-sm">Help Center</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Newsletter</h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Get the latest asset drops and market reports delivered to your inbox.
            </p>
            <form className="flex" onSubmit={(e) => { e.preventDefault(); }}>
              <input
                type="email"
                placeholder="Your email"
                required
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-mint focus:border-transparent text-sm"
              />
              <button 
                type="submit"
                className="bg-mint text-white px-4 py-2.5 rounded-r-lg hover:bg-mint-dark transition-colors flex items-center justify-center"
                aria-label="Subscribe to newsletter"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} MINT HUB Marketplace. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="#" className="text-gray-600 hover:text-mint text-sm transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-gray-600 hover:text-mint text-sm transition-colors">Terms of Service</Link>
              <Link href="#" className="text-gray-600 hover:text-mint text-sm transition-colors">Cookie Policy</Link>
              <Link href="#" className="text-gray-600 hover:text-mint text-sm transition-colors">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
