'use client';

import React, { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail('');
    }, 3000);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-mint via-mint-dark to-mint relative overflow-hidden border-t-2 border-mint/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20H0v-2h20zm0 0v2H0v-2h20zM0 20h20v2H0v-2zm0 4h20v2H0v-2zm0 4h20v2H0v-2z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-block bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-semibold mb-3 backdrop-blur-sm">
          STAY UPDATED
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Never Miss a Deal
        </h2>
        <p className="text-base text-white/90 mb-6 max-w-2xl mx-auto">
          Subscribe to our newsletter and get exclusive offers, new arrivals, and marketplace insights delivered to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-4 py-3 rounded-lg border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/70 focus:outline-none focus:border-white focus:bg-white/20 transition-all text-sm"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-mint rounded-lg font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl whitespace-nowrap text-sm"
            >
              {submitted ? 'Subscribed!' : 'Subscribe'}
            </button>
          </div>
          {submitted && (
            <p className="mt-3 text-white/90 text-xs">Thank you for subscribing!</p>
          )}
        </form>
      </div>
    </section>
  );
}
