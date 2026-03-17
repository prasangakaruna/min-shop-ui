import React from 'react';

interface FilterSidebarProps {
  category?: string;
}

export default function FilterSidebar({ category }: FilterSidebarProps) {
  const allCategories = [
    { name: 'All Products', count: 1240, active: !category || category === 'all' },
    { name: 'Electronics', count: 342, active: category === 'electronics' },
    { name: 'Furniture', count: 289, active: category === 'furniture' },
    { name: 'Fashion', count: 156, active: category === 'fashion' },
    { name: 'Groceries', count: 453, active: category === 'groceries' },
  ];

  const vehicleCategories = [
    { name: 'All Vehicles', count: 2450, active: true },
    { name: 'Electric Vehicles', count: 420, active: false },
    { name: 'Luxury Cars', count: 380, active: false },
    { name: 'SUVs', count: 650, active: false },
    { name: 'Trucks', count: 320, active: false },
    { name: 'Sports Cars', count: 280, active: false },
    { name: 'Hybrid', count: 400, active: false },
  ];

  const realEstateCategories = [
    { name: 'All Properties', count: 1120, active: true },
    { name: 'Luxury Homes', count: 280, active: false },
    { name: 'Condominiums', count: 320, active: false },
    { name: 'Single Family', count: 250, active: false },
    { name: 'Beach Properties', count: 120, active: false },
    { name: 'Estates', count: 80, active: false },
    { name: 'Investment', count: 70, active: false },
  ];

  const electronicsCategories = [
    { name: 'All Electronics', count: 1240, active: true },
    { name: 'Audio & Headphones', count: 342, active: false },
    { name: 'Cameras & Photography', count: 156, active: false },
    { name: 'Smart Home', count: 289, active: false },
    { name: 'Gaming', count: 245, active: false },
    { name: 'Televisions', count: 208, active: false },
  ];

  const groceryCategories = [
    { name: 'All Groceries', count: 453, active: true },
    { name: 'Fruits', count: 85, active: false },
    { name: 'Vegetables', count: 92, active: false },
    { name: 'Dairy & Eggs', count: 124, active: false },
    { name: 'Bakery', count: 68, active: false },
    { name: 'Pantry Staples', count: 84, active: false },
  ];

  let categories = allCategories;
  if (category === 'vehicles') categories = vehicleCategories;
  else if (category === 'real-estate') categories = realEstateCategories;
  else if (category === 'electronics') categories = electronicsCategories;
  else if (category === 'groceries') categories = groceryCategories;

  const allBrands = ['Sony', 'Bose', 'Apple', 'Samsung', 'Logitech', 'Nordic Design', 'EcoLiving'];
  const vehicleBrands = ['Tesla', 'BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Ford', 'Honda'];
  const realEstateBrands = ['Luxury Estates', 'Coastal Properties', 'Urban Living', 'Country Homes', 'Beachfront Realty'];
  const electronicsBrands = ['Sony', 'Bose', 'Apple', 'Samsung', 'Logitech', 'Canon', 'Nikon'];
  const groceryBrands = ['Earth\'s Best', 'Organic Valley', 'Fresh Farm', 'Nature\'s Choice', 'Green Harvest', 'Farm Fresh', 'Pure Organic'];
  
  let brands = allBrands;
  if (category === 'vehicles') brands = vehicleBrands;
  else if (category === 'real-estate') brands = realEstateBrands;
  else if (category === 'electronics') brands = electronicsBrands;
  else if (category === 'groceries') brands = groceryBrands;

  return (
    <aside className="w-full lg:w-64 space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Categories
        </h3>
        <ul className="space-y-2">
          {categories.map((cat, index) => (
            <li key={index}>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  defaultChecked={cat.active}
                  className="sr-only"
                />
                <div className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  cat.active 
                    ? 'bg-mint text-white' 
                    : 'bg-gray-50 text-gray-700 group-hover:bg-gray-100'
                }`}>
                  <span className="font-medium">{cat.name}</span>
                  <span className={`text-sm ${cat.active ? 'text-white/80' : 'text-gray-500'}`}>
                    {cat.count}
                  </span>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Brands</h3>
        <ul className="space-y-2">
          {brands.map((brand, index) => (
            <li key={index}>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={index === 2}
                  className="w-5 h-5 text-mint border-gray-300 rounded focus:ring-mint focus:ring-2"
                />
                <span className="ml-3 text-gray-700">{brand}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Price Range</h3>
        <div className="space-y-4">
          <div className="relative">
            <input
              type="range"
              min="0"
              max={
                category === 'groceries' ? '50' :
                category === 'vehicles' ? '100000' :
                category === 'real-estate' ? '10000000' :
                '5000'
              }
              defaultValue={
                category === 'groceries' ? '25' :
                category === 'vehicles' ? '50000' :
                category === 'real-estate' ? '2000000' :
                '2500'
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-mint"
            />
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>$0</span>
              <span>
                {category === 'groceries' ? '$50+' :
                 category === 'vehicles' ? '$100,000+' :
                 category === 'real-estate' ? '$10M+' :
                 '$5,000+'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Customer Rating</h3>
        <ul className="space-y-2">
          {[5, 4, 3].map((stars) => (
            <li key={stars}>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-mint border-gray-300 rounded focus:ring-mint focus:ring-2"
                />
                <div className="flex items-center ml-3">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < stars ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-sm text-gray-600 ml-1">& Up</span>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Clear Filters Button */}
      <button type="button" className="w-full bg-white border-2 border-mint text-mint py-2 rounded-lg font-medium hover:bg-mint/10 transition-colors" suppressHydrationWarning>
        Clear Filters
      </button>
    </aside>
  );
}
