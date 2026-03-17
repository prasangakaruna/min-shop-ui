 'use client';

 import React from 'react';
 import type { StorefrontProduct } from '@/lib/api';

 interface ProductSelectModalProps {
   open: boolean;
   loading: boolean;
   products: StorefrontProduct[];
   currencyLabel: string;
   search: string;
   onSearchChange: (value: string) => void;
   selectedProductIds: number[];
   onToggleProductSelected: (id: number) => void;
   onClose: () => void;
   onAddSelected: () => void;
 }

 export function ProductSelectModal({
   open,
   loading,
   products,
   currencyLabel,
   search,
   onSearchChange,
   selectedProductIds,
   onToggleProductSelected,
   onClose,
   onAddSelected,
 }: ProductSelectModalProps) {
   if (!open) return null;

   const filtered = products.filter((p) =>
     search ? p.title.toLowerCase().includes(search.toLowerCase()) : true,
   );

   return (
     <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
       <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg">
         <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
           <h2 className="text-sm font-medium text-gray-900">Select products</h2>
           <button
             type="button"
             onClick={onClose}
             className="text-gray-400 hover:text-gray-600"
           >
             ×
           </button>
         </div>

         <div className="px-5 pt-4">
           <input
             type="text"
             value={search}
             onChange={(e) => onSearchChange(e.target.value)}
             placeholder="Search products"
             className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
           />
         </div>

         <div className="px-5 pb-6">
           {loading ? (
             <div className="flex justify-center py-10">
               <div className="h-6 w-6 animate-spin rounded-full border-2 border-mint border-t-transparent" />
             </div>
           ) : products.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-gray-500">
               <span className="mb-3 text-3xl">🚫</span>
               <p>No products found</p>
             </div>
           ) : (
             <div className="max-h-80 overflow-auto rounded-lg border border-gray-100">
               {filtered.map((p) => {
                 const checked = selectedProductIds.includes(p.id);
                 return (
                   <label
                     key={p.id}
                     className="flex cursor-pointer items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0 hover:bg-gray-50"
                   >
                     <div className="flex items-center gap-3">
                       <input
                         type="checkbox"
                         checked={checked}
                         onChange={() => onToggleProductSelected(p.id)}
                         className="h-4 w-4 rounded border-gray-300 text-mint focus:ring-mint/40"
                       />
                       <span className="text-gray-800">{p.title}</span>
                     </div>
                     <span className="text-xs text-gray-600">
                       {currencyLabel} {p.price}
                     </span>
                   </label>
                 );
               })}
             </div>
           )}
         </div>

         <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500">
           <span>
             {selectedProductIds.length}/500 variants selected
           </span>
           <div className="flex gap-2">
             <button
               type="button"
               onClick={onClose}
               className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
             >
               Cancel
             </button>
             <button
               type="button"
               onClick={onAddSelected}
               disabled={selectedProductIds.length === 0}
               className="rounded-lg bg-mint px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
             >
               Add
             </button>
           </div>
         </div>
       </div>
     </div>
   );
 }

