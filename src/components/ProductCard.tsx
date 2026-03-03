import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  id: string;
  image: string;
  title: string;
  category: string;
  price: string;
  originalPrice?: string;
  rating?: number;
  badge?: string | null;
  badgeColor?: 'mint' | 'red' | 'blue';
}

export default function ProductCard({
  id,
  image,
  title,
  category,
  price,
  originalPrice,
  rating,
  badge,
  badgeColor = 'mint',
}: ProductCardProps) {
  const badgeColors = {
    mint: 'bg-mint',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {badge && (
          <div className="absolute top-3 left-3">
            <span className={`${badgeColors[badgeColor]} text-white px-3 py-1 rounded-full text-xs font-medium`}>
              {badge}
            </span>
          </div>
        )}
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase mb-1">{category}</p>
        <Link href={`/product/${id}`}>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-mint transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>
        
        {rating && (
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-1">{rating}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xl font-bold text-mint">{price}</span>
            {originalPrice && (
              <span className="text-sm text-gray-500 line-through ml-2">{originalPrice}</span>
            )}
          </div>
        </div>

        <button className="w-full bg-mint text-white py-2 rounded-lg font-medium hover:bg-mint-dark transition-colors flex items-center justify-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
