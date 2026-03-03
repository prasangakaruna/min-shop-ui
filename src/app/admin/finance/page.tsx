'use client';

import React, { useState } from 'react';

export default function FinancePage() {
  const [timeRange, setTimeRange] = useState('month');

  const financialStats = [
    {
      label: 'Total Revenue',
      value: '$124,580',
      change: '+12.5%',
      trend: 'up',
      icon: '💰',
    },
    {
      label: 'Total Expenses',
      value: '$45,230',
      change: '+5.2%',
      trend: 'up',
      icon: '📉',
    },
    {
      label: 'Net Profit',
      value: '$79,350',
      change: '+18.3%',
      trend: 'up',
      icon: '📊',
    },
    {
      label: 'Profit Margin',
      value: '63.7%',
      change: '+2.1%',
      trend: 'up',
      icon: '💹',
    },
  ];

  const transactions = [
    { id: 'TXN-001', type: 'Revenue', amount: '$299.00', description: 'Order ORD-2024-001234', date: '2024-03-15', status: 'Completed' },
    { id: 'TXN-002', type: 'Revenue', amount: '$458.98', description: 'Order ORD-2024-001189', date: '2024-03-14', status: 'Completed' },
    { id: 'TXN-003', type: 'Expense', amount: '-$1,200.00', description: 'Inventory Purchase', date: '2024-03-14', status: 'Completed' },
    { id: 'TXN-004', type: 'Revenue', amount: '$89.00', description: 'Order ORD-2024-001045', date: '2024-03-14', status: 'Pending' },
    { id: 'TXN-005', type: 'Expense', amount: '-$450.00', description: 'Marketing Campaign', date: '2024-03-13', status: 'Completed' },
    { id: 'TXN-006', type: 'Revenue', amount: '$1,499.00', description: 'Order ORD-2024-000623', date: '2024-03-12', status: 'Completed' },
  ];

  const revenueByCategory = [
    { category: 'Electronics', revenue: '$45,230', percentage: 36.3, color: 'bg-mint' },
    { category: 'Vehicles', revenue: '$38,900', percentage: 31.2, color: 'bg-blue-500' },
    { category: 'Real Estate', revenue: '$28,450', percentage: 22.8, color: 'bg-green-500' },
    { category: 'Groceries', revenue: '$12,000', percentage: 9.7, color: 'bg-yellow-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Finance & Analytics</h1>
          <p className="text-gray-600">Track your revenue, expenses, and financial performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-mint focus:border-mint"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="px-4 py-2 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-mint/10 rounded-lg flex items-center justify-center text-2xl">
                {stat.icon}
              </div>
              <span className={`text-sm font-semibold ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Revenue by Category</h2>
          <div className="space-y-4">
            {revenueByCategory.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">{item.category}</span>
                  <span className="text-sm font-bold text-gray-800">{item.revenue}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`${item.color} h-3 rounded-full transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{item.percentage}% of total revenue</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Transactions</h2>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.type === 'Revenue'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                    <span className="text-xs text-gray-500">{transaction.id}</span>
                  </div>
                  <p className="text-sm text-gray-700">{transaction.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    transaction.type === 'Revenue' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount}
                  </p>
                  <span className="text-xs text-gray-500">{transaction.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Financial Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Period</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Expenses</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Profit</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Margin</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">This Month</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">$124,580</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">$45,230</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-mint">$79,350</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">63.7%</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">Last Month</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">$110,750</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">$42,980</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-mint">$67,770</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">61.2%</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">This Quarter</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">$358,420</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">$132,150</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-mint">$226,270</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">63.1%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
