import React from 'react';
import Image from 'next/image';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Business Owner',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    rating: 5,
    text: 'Mint Hub made selling my luxury car effortless. The platform is professional, secure, and I got the best price possible.',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Real Estate Investor',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    rating: 5,
    text: 'As a frequent buyer, I trust Mint Hub for all my high-value purchases. The verification process gives me confidence.',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Tech Entrepreneur',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
    rating: 5,
    text: 'The best marketplace I\'ve used. Fast transactions, excellent support, and premium quality products. Highly recommended!',
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-mint/10 text-mint-dark px-3 py-1 rounded-full text-xs font-semibold mb-3">
            TESTIMONIALS
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            What Our Customers Say
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Real feedback from real customers who trust Mint Hub
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                &quot;{testimonial.text}&quot;
              </p>

              {/* Author */}
              <div className="flex items-center">
                <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3 ring-2 ring-mint/20">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{testimonial.name}</div>
                  <div className="text-xs text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
