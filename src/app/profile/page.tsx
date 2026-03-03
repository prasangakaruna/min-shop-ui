'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProfilePage() {
  const pathname = usePathname();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-01-15',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as object,
          [child]: value,
        },
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
    setToastMessage('Profile updated successfully!');
    setToastType('success');
    setShowToast(true);
  };

  const orders = [
    { id: 'ORD-001', date: '2024-03-15', total: '$299.00', status: 'Delivered', items: 2 },
    { id: 'ORD-002', date: '2024-03-10', total: '$159.00', status: 'Shipped', items: 1 },
    { id: 'ORD-003', date: '2024-03-05', total: '$89.00', status: 'Processing', items: 1 },
  ];

  const navLinks = [
    { href: '/profile/orders', label: 'My Orders', icon: '📦' },
    { href: '/profile/track-order', label: 'Track Order', icon: '🚚' },
    { href: '/profile/wishlist', label: 'Wishlist', icon: '❤️' },
    { href: '/profile/addresses', label: 'Addresses', icon: '📍' },
    { href: '/profile/payment-methods', label: 'Payment Methods', icon: '💳' },
    { href: '/profile/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 animate-fade-in">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-mint transition-colors">Home</Link></li>
            <li>/</li>
            <li className="text-gray-800 font-medium">Profile</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 animate-slide-up">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Profile Header with Gradient */}
              <div className="bg-gradient-to-br from-mint to-mint-dark p-6 text-white">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                      <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <button 
                      className="absolute bottom-0 right-0 w-10 h-10 bg-white text-mint rounded-full flex items-center justify-center hover:bg-gray-100 shadow-lg transition-all hover:scale-110"
                      aria-label="Change profile picture"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                  <h2 className="text-2xl font-bold mb-1">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <p className="text-white/90 text-sm">{profileData.email}</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-mint/10 to-mint/5 rounded-xl border border-mint/20 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-mint/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Total Orders</span>
                  </div>
                  <span className="font-bold text-mint text-xl">12</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-pink-100/50 rounded-xl border border-pink-200/50 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Wishlist</span>
                  </div>
                  <span className="font-bold text-pink-600 text-xl">5</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100/50 rounded-xl border border-yellow-200/50 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Reward Points</span>
                  </div>
                  <span className="font-bold text-yellow-600 text-xl">1,250</span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="px-6 pb-6 space-y-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-mint text-white shadow-md'
                          : 'text-gray-700 hover:bg-mint/10 hover:text-mint'
                      }`}
                    >
                      <span className="text-lg">{link.icon}</span>
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 animate-slide-up">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">Personal Information</h3>
                  <p className="text-gray-600">Manage your personal details and preferences</p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-3 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-all shadow-md hover:shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all disabled:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all disabled:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all disabled:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all disabled:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={profileData.dateOfBirth}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all disabled:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">Address</h3>
                <p className="text-gray-600">Your default shipping address</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    name="address.street"
                    value={profileData.address.street}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all disabled:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={profileData.address.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all disabled:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={profileData.address.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all disabled:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={profileData.address.zipCode}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all disabled:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    name="address.country"
                    value={profileData.address.country}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint transition-all disabled:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">Recent Orders</h3>
                  <p className="text-gray-600">Your latest purchase history</p>
                </div>
                <Link 
                  href="/profile/orders" 
                  className="text-mint hover:text-mint-dark font-semibold flex items-center space-x-1 transition-colors"
                >
                  <span>View All</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <Link
                    key={order.id}
                    href={`/order/${order.id}`}
                    className="block p-5 border-2 border-gray-200 rounded-xl hover:border-mint hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <p className="font-bold text-gray-800 group-hover:text-mint transition-colors">{order.id}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'Delivered'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'Shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{order.date}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <span>{order.items} {order.items === 1 ? 'item' : 'items'}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-mint text-xl mb-1">{order.total}</p>
                        <span className="text-sm text-gray-500 group-hover:text-mint transition-colors flex items-center justify-end space-x-1">
                          <span>View Details</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
