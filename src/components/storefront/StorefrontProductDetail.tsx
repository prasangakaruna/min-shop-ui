'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { getImageDisplayUrl } from '@/lib/api';
import type { StorefrontProduct, ProductVariant, NutritionFacts } from '@/lib/api';

function variantOptionsMap(v: ProductVariant): Record<string, string> {
  const o = v.options;
  if (!o || typeof o !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(o)) {
    if (val === null || val === undefined) continue;
    const s = typeof val === 'string' ? val : String(val);
    if (s.trim()) out[k] = s.trim();
  }
  return out;
}

function findMatchingVariant(
  variants: ProductVariant[] | undefined,
  groupNames: { name: string }[],
  selection: Record<string, string>
): ProductVariant | undefined {
  if (!variants?.length) return undefined;
  if (!groupNames.length) return variants[0];
  const allFilled = groupNames.every((g) => (selection[g.name] ?? '').trim() !== '');
  if (!allFilled) return undefined;
  return variants.find((v) => {
    const vo = variantOptionsMap(v);
    return groupNames.every((g) => vo[g.name] === selection[g.name]);
  });
}

function formatUnitPriceLabel(priceStr: string, weightOz: number | null | undefined): string | null {
  if (weightOz == null || weightOz <= 0) return null;
  const p = parseFloat(priceStr);
  if (Number.isNaN(p) || p <= 0) return null;
  const centsPerOz = (p / weightOz) * 100;
  return `${centsPerOz >= 100 ? `$${(centsPerOz / 100).toFixed(2)}` : `${centsPerOz.toFixed(1)} ¢`}/oz`;
}

/** Object-fit: contain — drawable image rect inside element box */
function getContainRect(el: HTMLImageElement) {
  const cw = el.clientWidth;
  const ch = el.clientHeight;
  const nw = el.naturalWidth;
  const nh = el.naturalHeight;
  if (!nw || !nh || !cw || !ch) return null;
  const r = Math.min(cw / nw, ch / nh);
  const dw = nw * r;
  const dh = nh * r;
  const ox = (cw - dw) / 2;
  const oy = (ch - dh) / 2;
  return { ox, oy, dw, dh, nw, nh };
}

const ZOOM_FACTOR = 2.75;
const LENS_FRAC = 0.38;
const POPUP_SIZE = 400;
/** Pixels beyond the image box where the zoom popup still appears */
const PROXIMITY_PAD = 72;

function computePopupPosition(imgRect: DOMRect, popupW: number, popupH: number): { left: number; top: number } {
  const gap = 16;
  const edge = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = imgRect.right + gap;
  let top = imgRect.top + (imgRect.height - popupH) / 2;
  if (left + popupW > vw - edge) {
    left = imgRect.left - gap - popupW;
  }
  if (left < edge) {
    left = Math.min(edge, vw - popupW - edge);
  }
  top = Math.max(edge, Math.min(top, vh - popupH - edge));
  return { left, top };
}

function ProductHoverZoom({
  src,
  alt,
  onOpenLightbox,
}: {
  src: string;
  alt: string;
  onOpenLightbox: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [active, setActive] = useState(false);
  const [popupPos, setPopupPos] = useState({ left: 0, top: 0 });
  const [lens, setLens] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [bg, setBg] = useState({ sizeW: 0, sizeH: 0, posX: 0, posY: 0 });

  const updateFromEvent = useCallback((clientX: number, clientY: number) => {
    const img = imgRef.current;
    if (!img || !imgLoaded) return;
    const rect = img.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const c = getContainRect(img);
    if (!c) return;
    const { ox, oy, dw, dh, nw, nh } = c;
    const ix = mx - ox;
    const iy = my - oy;
    if (ix < 0 || iy < 0 || ix > dw || iy > dh) {
      setActive(false);
      return;
    }

    const lensW = Math.min(dw, Math.max(64, dw * LENS_FRAC));
    const lensH = Math.min(dh, Math.max(64, dh * LENS_FRAC));
    const lensCx = Math.min(Math.max(ix, lensW / 2), dw - lensW / 2);
    const lensCy = Math.min(Math.max(iy, lensH / 2), dh - lensH / 2);
    const lensLeft = ox + lensCx - lensW / 2;
    const lensTop = oy + lensCy - lensH / 2;

    const paneW = POPUP_SIZE;
    const paneH = POPUP_SIZE;

    const bgW = nw * ZOOM_FACTOR;
    const bgH = nh * ZOOM_FACTOR;
    const posX = paneW / 2 - (lensCx / dw) * bgW;
    const posY = paneH / 2 - (lensCy / dh) * bgH;

    setLens({ left: lensLeft, top: lensTop, width: lensW, height: lensH });
    setBg({ sizeW: bgW, sizeH: bgH, posX, posY });
    setActive(true);
  }, [imgLoaded]);

  const updateFromEventRef = useRef(updateFromEvent);
  updateFromEventRef.current = updateFromEvent;

  useEffect(() => {
    setImgLoaded(false);
    setActive(false);
    setShowPopup(false);
  }, [src]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setEnabled(mq.matches && !reduced.matches);
    sync();
    mq.addEventListener('change', sync);
    reduced.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      reduced.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !imgLoaded) return;

    const onPointerMove = (e: PointerEvent) => {
      const img = imgRef.current;
      if (!img) return;
      const r = img.getBoundingClientRect();
      const near =
        e.clientX >= r.left - PROXIMITY_PAD &&
        e.clientX <= r.right + PROXIMITY_PAD &&
        e.clientY >= r.top - PROXIMITY_PAD &&
        e.clientY <= r.bottom + PROXIMITY_PAD;

      if (!near) {
        setShowPopup(false);
        setActive(false);
        return;
      }

      setShowPopup(true);
      setPopupPos(computePopupPosition(r, POPUP_SIZE, POPUP_SIZE));
      updateFromEventRef.current(e.clientX, e.clientY);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [enabled, imgLoaded]);

  useEffect(() => {
    if (!enabled || !showPopup) return;

    const reposition = () => {
      const img = imgRef.current;
      if (!img) return;
      setPopupPos(computePopupPosition(img.getBoundingClientRect(), POPUP_SIZE, POPUP_SIZE));
    };

    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [enabled, showPopup]);

  return (
    <>
      <div className="relative w-full min-w-0">
        <div
          className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm sm:aspect-[4/3] lg:max-w-[min(100%,520px)]"
        >
          <img
            ref={imgRef}
            key={src}
            src={src}
            alt={alt}
            draggable={false}
            onLoad={() => setImgLoaded(true)}
            className={`h-full w-full select-none object-contain ${enabled ? 'cursor-crosshair' : 'cursor-zoom-in'}`}
            onClick={() => onOpenLightbox()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenLightbox();
              }
            }}
          />
          {enabled && active && imgLoaded ? (
            <div
              className="pointer-events-none absolute z-10 rounded-md border-2 border-white/90 bg-white/25 shadow-[0_0_0_1px_rgba(0,0,0,0.15),inset_0_0_0_1px_rgba(255,255,255,0.4)] backdrop-blur-[1px]"
              style={{
                left: lens.left,
                top: lens.top,
                width: lens.width,
                height: lens.height,
              }}
              aria-hidden
            />
          ) : null}
        </div>
      </div>

      {enabled && showPopup ? (
        <div
          className="pointer-events-none fixed z-[100] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-lg ring-1 ring-black/5"
          style={{
            left: popupPos.left,
            top: popupPos.top,
            width: POPUP_SIZE,
            height: POPUP_SIZE,
          }}
          role="img"
          aria-label={active && imgLoaded ? 'Magnified product view' : 'Product zoom preview'}
        >
          <div
            className="absolute inset-0 bg-no-repeat"
            style={{
              backgroundImage: `url(${JSON.stringify(src)})`,
              backgroundSize: `${bg.sizeW}px ${bg.sizeH}px`,
              backgroundPosition: `${bg.posX}px ${bg.posY}px`,
              opacity: active && imgLoaded ? 1 : 0,
              transition: 'opacity 100ms ease-out',
            }}
          />
          {!active || !imgLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-4 text-center text-xs text-gray-400">
              Move over the image to zoom
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function nutritionFactsHasContent(nf: NutritionFacts | null | undefined): boolean {
  if (!nf || typeof nf !== 'object') return false;
  if (nf.serves_about?.trim()) return true;
  if (nf.serving_size?.trim()) return true;
  if (nf.serving_weight?.trim()) return true;
  if (nf.calories?.trim()) return true;
  const rows = nf.rows;
  if (!Array.isArray(rows)) return false;
  return rows.some((r) => (r.label?.trim() ?? '') !== '' || (r.amount?.trim() ?? '') !== '');
}

function RetailSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-serif text-lg font-normal tracking-tight text-gray-900 md:text-xl">
      <span className="border-b-[3px] border-double border-gray-900 pb-1">{children}</span>
    </h3>
  );
}

function LoveThisTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="relative inline-flex min-h-[2.75rem] items-center py-2 pl-7 pr-4 text-sm font-medium text-gray-900 shadow-[2px_2px_6px_rgba(0,0,0,0.12)]"
      style={{
        background: 'linear-gradient(180deg, #ebe4d6 0%, #ddd3c4 100%)',
        clipPath: 'polygon(14px 0%, 100% 0%, 100% 100%, 14px 100%, 0% 50%)',
      }}
    >
      <span
        className="absolute left-2.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] ring-1 ring-black/10"
        aria-hidden
      />
      {children}
    </span>
  );
}

function ProductRetailHighlightBlock({ product }: { product: StorefrontProduct }) {
  const love = (product.we_love_this_for ?? []).map((s) => s.trim()).filter(Boolean);
  const allergen = product.ingredients_allergen?.trim() ?? '';
  const ingredientsBody = product.ingredients?.trim() ?? '';
  const nf = product.nutrition_facts;
  const hasNutrition = nutritionFactsHasContent(nf ?? null);
  const hasLove = love.length > 0;
  const hasAllergen = allergen.length > 0;
  const showRetailBlock = hasLove || hasAllergen || hasNutrition;
  const showIngredientsColumn = ingredientsBody.length > 0 || hasAllergen;

  if (!showRetailBlock) return null;

  return (
    <section
      className="mb-10 rounded-2xl border border-stone-200 bg-[#faf8f5] p-6 shadow-sm md:p-8"
      aria-label="Product details"
    >
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:[grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {hasLove ? (
          <div>
            <RetailSectionTitle>We Love This For&hellip;</RetailSectionTitle>
            <ul className="mt-5 grid list-none grid-cols-1 gap-3 sm:grid-cols-2" role="list">
              {love.map((tag) => (
                <li key={tag}>
                  <LoveThisTag>{tag}</LoveThisTag>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showIngredientsColumn && (hasLove || hasAllergen || hasNutrition) ? (
          <div>
            <RetailSectionTitle>Ingredients</RetailSectionTitle>
            {ingredientsBody ? (
              <p className="mt-5 font-sans text-xs font-semibold uppercase leading-relaxed tracking-wide text-gray-800">
                {ingredientsBody}
              </p>
            ) : null}
            {hasAllergen ? (
              <div className={`mt-4 border-t border-gray-300 pt-4 ${ingredientsBody ? '' : 'mt-5'}`}>
                <p className="font-sans text-xs font-bold uppercase tracking-wide text-gray-900">{allergen}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {hasNutrition && nf ? (
          <div className="max-w-md">
            <RetailSectionTitle>Nutrition Facts</RetailSectionTitle>
            <div className="mt-5 space-y-3 font-sans text-gray-900">
              {nf.serves_about?.trim() ? (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Serves about {nf.serves_about.trim()}
                </p>
              ) : null}
              {(nf.serving_size?.trim() || nf.serving_weight?.trim()) && (
                <p className="text-sm">
                  <span className="text-[10px] font-semibold uppercase text-gray-600">Serving size </span>
                  {nf.serving_size?.trim() ? (
                    <span className="text-2xl font-bold leading-none">{nf.serving_size.trim()}</span>
                  ) : null}
                  {nf.serving_weight?.trim() ? (
                    <span className="text-sm font-normal text-gray-700"> ({nf.serving_weight.trim()})</span>
                  ) : null}
                </p>
              )}
              {nf.calories?.trim() ? (
                <p className="text-sm">
                  <span className="text-[10px] font-semibold uppercase text-gray-600">Calories per serving </span>
                  <span className="text-2xl font-bold">{nf.calories.trim()}</span>
                </p>
              ) : null}
              {(nf.rows?.length ?? 0) > 0 ? (
                <div className="border-t-2 border-gray-900 pt-2">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-gray-900 pb-1 text-[10px] font-bold uppercase tracking-wide">
                    <span />
                    <span className="text-right">Amount</span>
                    <span className="text-right">%DV</span>
                  </div>
                  <ul className="divide-y divide-gray-400 text-sm">
                    {(nf.rows ?? []).map((row, i) => {
                      const ind = Math.min(3, Math.max(0, row.indent ?? 0));
                      return (
                        <li
                          key={`${row.label}-${i}`}
                          className="grid grid-cols-[1fr_auto_auto] gap-x-3 py-2"
                        >
                          <span className="font-semibold" style={{ paddingLeft: ind * 12 }}>
                            {row.label}
                          </span>
                          <span className="text-right tabular-nums">{row.amount}</span>
                          <span className="text-right tabular-nums text-gray-700">{row.dv ?? '—'}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StarRow({ average, count }: { average: number; count: number }) {
  const full = Math.floor(average);
  const partial = average - full >= 0.5;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-0.5" aria-label={`${average} out of 5 stars, ${count} ratings`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={i < full ? 'text-amber-400' : i === full && partial ? 'text-amber-400' : 'text-gray-200'}>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
        ))}
      </div>
      <span className="text-sm font-semibold text-gray-900">{average.toFixed(1)}</span>
      <span className="text-sm text-gray-500">({count.toLocaleString()} ratings)</span>
    </div>
  );
}

type Props = {
  product: StorefrontProduct;
  storeQuery: string;
  selectedImage: number;
  setSelectedImage: (i: number) => void;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  optionSelection: Record<string, string>;
  setOptionSelection: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  addingToCart: boolean;
  addToCartMessage: string | null;
  onAddToCart: () => void;
  similarProducts: StorefrontProduct[];
};

export default function StorefrontProductDetail({
  product,
  storeQuery,
  selectedImage,
  setSelectedImage,
  quantity,
  setQuantity,
  optionSelection,
  setOptionSelection,
  addingToCart,
  addToCartMessage,
  onAddToCart,
  similarProducts,
}: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const images = product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : [];
  const optionGroups = product.option_groups ?? [];
  const activeVariant = findMatchingVariant(product.variants, optionGroups, optionSelection);
  const firstVariant = product.variants?.[0];
  const displayVariant = optionGroups.length > 0 ? activeVariant : firstVariant;
  const compareAtPrice = displayVariant?.compare_at_price ?? null;
  const displayPrice = displayVariant?.price ?? product.price;
  const totalStock = product.variants?.reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0) ?? 0;
  const variantStock = displayVariant?.inventory_quantity ?? 0;
  const inStock =
    optionGroups.length > 0 ? variantStock > 0 && Boolean(displayVariant) : totalStock > 0;
  const optionUnavailable =
    optionGroups.length > 0 && activeVariant === undefined && optionGroups.every((g) => (optionSelection[g.name] ?? '').trim() !== '');

  const inStockValueLabelsByGroup: Record<string, Set<string>> = {};
  if (optionGroups.length > 0 && product.variants?.length) {
    for (const g of optionGroups) inStockValueLabelsByGroup[g.name] = new Set<string>();
    for (const v of product.variants) {
      const qty = v.inventory_quantity ?? 0;
      if (qty <= 0) continue;
      const vo = variantOptionsMap(v);
      for (const g of optionGroups) {
        const label = vo[g.name];
        if (label) inStockValueLabelsByGroup[g.name]?.add(label);
      }
    }
  }

  const unitLabel = formatUnitPriceLabel(displayPrice, product.weight_oz ?? null);
  const productHref = (id: number) => `/product/${id}${storeQuery}`;

  const homeHref = product.store?.slug ? `/?store=${encodeURIComponent(product.store.slug)}` : '/';
  const productsHref = product.store?.slug ? `/products?store=${encodeURIComponent(product.store.slug)}` : '/products';
  const categoryHref =
    product.category && product.store?.slug
      ? `/products?store=${encodeURIComponent(product.store.slug)}&category=${encodeURIComponent(product.category)}`
      : productsHref;

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
            <li>
              <Link href={homeHref} className="hover:text-teal-700">
                Home
              </Link>
            </li>
            <li className="text-gray-300" aria-hidden>
              /
            </li>
            <li>
              <Link href={productsHref} className="hover:text-teal-700">
                Products
              </Link>
            </li>
            {product.category ? (
              <>
                <li className="text-gray-300" aria-hidden>
                  /
                </li>
                <li>
                  <Link href={categoryHref} className="hover:text-teal-700">
                    {product.category}
                  </Link>
                </li>
              </>
            ) : null}
            <li className="text-gray-300" aria-hidden>
              /
            </li>
            <li className="text-gray-900 font-medium truncate max-w-[min(100%,16rem)]">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          {/* Gallery */}
          <div className="min-w-0">
            {images.length > 0 ? (
              <ProductHoverZoom
                src={getImageDisplayUrl(images[selectedImage])}
                alt={product.title}
                onOpenLightbox={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="relative flex aspect-square w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-400 sm:aspect-[4/3]">
                No image
              </div>
            )}

            {images.length > 1 ? (
              <div className="mt-4">
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                    {images.map((url, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedImage(index)}
                        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                          selectedImage === index ? 'border-teal-600 ring-2 ring-teal-600/20' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img src={getImageDisplayUrl(url)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
                {images.length > 5 ? (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="mt-2 text-sm font-medium text-teal-700 hover:text-teal-800 hover:underline"
                  >
                    View all {images.length} photos
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Buy box */}
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand ? (
                <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-700">
                  {product.brand}
                </span>
              ) : null}
              {product.category ? (
                <span className="rounded-full bg-teal-50 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-teal-800">
                  {product.category}
                </span>
              ) : null}
              {product.package_size ? (
                <span className="text-sm text-gray-500">{product.package_size}</span>
              ) : null}
            </div>

            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">{product.title}</h1>

            {product.rating && product.rating.count > 0 ? (
              <div className="mt-3">
                <StarRow average={product.rating.average} count={product.rating.count} />
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-baseline gap-3 border-b border-gray-100 pb-6">
              <span className="text-4xl font-bold text-teal-700">${displayPrice}</span>
              {compareAtPrice ? (
                <span className="text-xl text-gray-400 line-through">${compareAtPrice}</span>
              ) : null}
              {unitLabel ? <span className="text-sm font-medium text-gray-600">{unitLabel}</span> : null}
            </div>

            {displayVariant?.sku ? (
              <p className="mt-2 text-xs text-gray-500">
                SKU: <span className="font-mono text-gray-700">{displayVariant.sku}</span>
              </p>
            ) : null}

            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm text-gray-700">
              <p className="font-medium text-gray-900">How you&apos;ll get it</p>
              <p className="mt-1 text-gray-600">
                Sold by <span className="font-semibold text-gray-800">{product.store?.name ?? 'Store'}</span>. Add to cart to
                see shipping and totals at checkout.
              </p>
            </div>

            {optionGroups.length > 0 && (
              <div className="mt-6 space-y-4">
                {optionGroups.map((g) => (
                  <div key={g.id}>
                    <p className="text-sm font-semibold text-gray-900 mb-2">{g.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {g.values.map((val) => {
                        const selected = optionSelection[g.name] === val.label;
                        const labels = inStockValueLabelsByGroup[g.name];
                        const hasAnyInStock = Boolean(labels && labels.size > 0);
                        const isAvailable = !hasAnyInStock ? true : Boolean(labels?.has(val.label));
                        const isDisabled = !isAvailable;
                        return (
                          <button
                            key={val.id}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              if (isDisabled) return;
                              setOptionSelection((s) => ({ ...s, [g.name]: val.label }));
                            }}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                              selected
                                ? 'border-teal-600 bg-teal-50 text-teal-900'
                                : isDisabled
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {val.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {optionUnavailable && (
                  <p className="text-sm text-amber-800">This combination is not available. Try another option.</p>
                )}
              </div>
            )}

            <div className="mt-4">
              {optionGroups.length > 0 ? (
                displayVariant ? (
                  inStock ? (
                    <p className="text-sm font-medium text-green-700">In stock ({variantStock} available)</p>
                  ) : (
                    <p className="text-sm font-medium text-red-600">Out of stock</p>
                  )
                ) : (
                  <p className="text-sm text-gray-600">Select options to see availability.</p>
                )
              ) : inStock ? (
                <p className="text-sm font-medium text-green-700">In stock ({totalStock} available)</p>
              ) : (
                <p className="text-sm font-medium text-red-600">Out of stock</p>
              )}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2.5 text-lg text-gray-700 hover:bg-gray-50"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="min-w-[3rem] border-x border-gray-200 px-4 py-2.5 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-2.5 text-lg text-gray-700 hover:bg-gray-50"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {addToCartMessage ? (
              <p className={`mt-3 text-sm ${addToCartMessage === 'Added to cart' ? 'text-green-600' : 'text-red-600'}`}>
                {addToCartMessage}
              </p>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={!inStock || addingToCart || (optionGroups.length > 0 && !displayVariant)}
                onClick={onAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingToCart ? (
                  'Adding…'
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to cart
                  </>
                )}
              </button>
              <button
                type="button"
                className="flex items-center justify-center rounded-xl border-2 border-gray-200 px-6 py-3.5 text-gray-600 hover:border-teal-300 hover:bg-teal-50/50"
                aria-label="Save to list (coming soon)"
                title="Lists coming soon"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500">Free return window and final taxes appear at checkout when your store enables them.</p>
          </div>
        </div>

        {/* Key features + long-form (Walmart-style sections) */}
        <div className="mt-14 border-t border-gray-200 pt-12">
          <ProductRetailHighlightBlock product={product} />

          {product.key_features && product.key_features.length > 0 ? (
            <section className="mb-10">
              <h2 className="text-lg font-bold text-gray-900">Key features</h2>
              <ul className="mt-4 space-y-3">
                {product.key_features.map((feature, index) => (
                  <li key={index} className="flex gap-3 text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {product.description ? (
            <section className="mb-10">
              <h2 className="text-lg font-bold text-gray-900">About this item</h2>
              <div className="prose prose-gray mt-4 max-w-none text-gray-700 whitespace-pre-wrap">{product.description}</div>
            </section>
          ) : null}

          <div className="space-y-3">
            {product.ingredients &&
            !(
              (product.we_love_this_for?.length ?? 0) > 0 ||
              (product.ingredients_allergen?.trim() ?? '') !== '' ||
              nutritionFactsHasContent(product.nutrition_facts)
            ) ? (
              <details className="group rounded-xl border border-gray-200 bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  <span>Ingredients</span>
                  <span className="text-gray-400 transition group-open:rotate-180" aria-hidden>
                    ▼
                  </span>
                </summary>
                <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {product.ingredients}
                </div>
              </details>
            ) : null}

            {product.specifications && product.specifications.length > 0 ? (
              <details className="group rounded-xl border border-gray-200 bg-white open:shadow-sm" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  <span>Specifications</span>
                  <span className="text-gray-400 transition group-open:rotate-180" aria-hidden>
                    ▼
                  </span>
                </summary>
                <div className="border-t border-gray-100 px-5 py-2">
                  <dl className="divide-y divide-gray-100">
                    {product.specifications.map((row, i) => (
                      <div key={i} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">{row.label}</dt>
                        <dd className="text-sm text-gray-900 sm:col-span-2">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            ) : null}

            {product.directions ? (
              <details className="group rounded-xl border border-gray-200 bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  <span>Directions</span>
                  <span className="text-gray-400 transition group-open:rotate-180" aria-hidden>
                    ▼
                  </span>
                </summary>
                <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {product.directions}
                </div>
              </details>
            ) : null}

            {product.warnings ? (
              <details className="group rounded-xl border border-amber-200 bg-amber-50/50 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 font-semibold text-amber-950 [&::-webkit-details-marker]:hidden">
                  <span>Warnings</span>
                  <span className="text-amber-700 transition group-open:rotate-180" aria-hidden>
                    ▼
                  </span>
                </summary>
                <div className="border-t border-amber-100 px-5 py-4 text-sm leading-relaxed text-amber-950 whitespace-pre-wrap">
                  {product.warnings}
                </div>
              </details>
            ) : null}
          </div>
        </div>

        {similarProducts.length > 0 ? (
          <section className="mt-16 border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-gray-900">Similar items you might like</h2>
            <p className="mt-1 text-gray-600">Based on the same category in this store.</p>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similarProducts.map((item) => {
                const img = item.image_urls?.[0] ?? item.image_url ?? '';
                return (
                  <Link
                    key={item.id}
                    href={productHref(item.id)}
                    className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-teal-200 hover:shadow-md"
                  >
                    <div className="relative aspect-square bg-gray-50">
                      {img ? (
                        <img
                          src={getImageDisplayUrl(img)}
                          alt={item.title}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-teal-700">{item.title}</h3>
                      <p className="mt-2 text-lg font-bold text-teal-700">${item.price}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>

      {lightboxOpen && images.length > 0 ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="All product images"
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
            >
              Close
            </button>
          </div>
          <div className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto">
            <img
              src={getImageDisplayUrl(images[selectedImage])}
              alt=""
              className="mx-auto max-h-[50vh] w-auto max-w-full object-contain"
            />
            <div className="flex flex-wrap justify-center gap-2">
              {images.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${selectedImage === i ? 'border-white' : 'border-transparent opacity-70'}`}
                >
                  <img src={getImageDisplayUrl(url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
