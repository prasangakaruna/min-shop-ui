'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Don't show sidebar/header on login/signup pages
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/signup';

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/products', label: 'Products', icon: '📦' },
    { href: '/admin/orders', label: 'Orders', icon: '🛒' },
    { href: '/admin/finance', label: 'Finance', icon: '💰' },
    { href: '/admin/statistics', label: 'Statistics', icon: '📈' },
  ];

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-mint rounded flex items-center justify-center">
                <div className="w-4 h-4 bg-white transform rotate-45"></div>
              </div>
              <span className="text-xl font-bold text-gray-800">Admin Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="px-4 py-2 text-gray-700 hover:text-mint transition-colors text-sm font-medium"
            >
              View Site
            </Link>
            <Link
              href="/admin/login"
              className="px-4 py-2 text-gray-700 hover:text-mint transition-colors text-sm font-medium"
            >
              Logout
            </Link>
            <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300 lg:translate-x-0`}
        >
          <div className="h-full overflow-y-auto py-6">
            <nav className="space-y-1 px-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-mint text-white shadow-md'
                        : 'text-gray-700 hover:bg-mint/10 hover:text-mint'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
