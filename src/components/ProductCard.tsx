import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingCart, CheckCircle, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { formatTZS } from '../utils';
import SafeImage from './SafeImage';

export interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onQuickOrder?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickOrder }: ProductCardProps) {
  const navigate = useNavigate();

  // Calculate pricing range and discounts
  const variants = product.variants || [];
  let displayPrice = product.price || 0;
  let hasPriceRange = false;
  let maxDiscountComparePrice: number | null = null;
  let isProductAvailable = product.available !== false;

  if (variants.length > 0) {
    const availableVariants = variants.filter((v) => v.available && v.stock > 0);
    if (availableVariants.length === 0 && variants.length > 0) {
      isProductAvailable = false;
    }

    const prices = variants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    displayPrice = minPrice;
    if (minPrice !== maxPrice) {
      hasPriceRange = true;
    }

    // Find any compareAtPrice on lowest priced variant or any variant
    const discountedVariant = variants.find((v) => v.compareAtPrice && v.compareAtPrice > v.price);
    if (discountedVariant?.compareAtPrice) {
      maxDiscountComparePrice = discountedVariant.compareAtPrice;
    }
  }

  // Get primary image
  const primaryImage = product.featuredImageUrl || (product.images && product.images[0]?.imageUrl) || product.image || '';

  const productUrl = `/products/${product.slug || product.id}`;

  return (
    <div 
      className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-emerald-200"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Area */}
      <div className="relative overflow-hidden h-56 bg-emerald-50/60">
        <Link to={productUrl} className="block w-full h-full">
          <SafeImage
            src={primaryImage}
            alt={product.name}
            placeholderText="NITA Product Image"
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          <span className="bg-emerald-800/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-sm">
            {product.category}
          </span>
          {product.isFeatured && (
            <span className="bg-orange-500/90 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Featured</span>
            </span>
          )}
        </div>

        {/* Stock Status Badge bottom-left overlay */}
        <div className="absolute bottom-3 left-3 pointer-events-none">
          {isProductAvailable ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900/80 backdrop-blur-md text-emerald-200 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-900/80 backdrop-blur-md text-gray-300 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Product Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-left">
        <div className="space-y-2">
          <Link to={productUrl} className="block group-hover:text-emerald-700 transition">
            <h3 className="font-bold text-gray-900 text-base line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {product.shortDescription || product.description}
          </p>

          {/* Sizes / Variants Pills */}
          {variants.length > 0 && (
            <div className="pt-1.5 flex flex-wrap gap-1">
              {variants.map((v) => (
                <span
                  key={v.id}
                  className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md border border-gray-200/60"
                >
                  {v.name}{v.size !== v.name ? ` / ${v.size}` : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Actions */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider">
              {hasPriceRange ? 'Starting From' : 'Price'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-emerald-900 font-black text-sm sm:text-base font-sans">
                {hasPriceRange ? `From ${formatTZS(displayPrice)}` : formatTZS(displayPrice)}
              </span>
              {maxDiscountComparePrice && (
                <span className="text-[11px] text-gray-400 line-through">
                  {formatTZS(maxDiscountComparePrice)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onQuickOrder && (
              <button
                type="button"
                onClick={() => onQuickOrder(product)}
                disabled={!isProductAvailable}
                title="Quick Order"
                className="p-2 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white rounded-xl transition duration-200 disabled:opacity-50 disabled:pointer-events-none"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(productUrl)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-800 text-xs font-bold rounded-xl transition duration-200 flex items-center space-x-1"
            >
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
