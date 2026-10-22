import { variantLabel } from '../variantLabel';
﻿import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  ListPlus,
  Heart,
  Award,
  ShieldAlert,
  ShoppingCart,
  MessageSquare,
  Sparkles,
  Layers,
  ChevronRight,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { trackPageView, formatTZS, getWhatsAppLink } from '../utils';

import SafeImage from '../components/SafeImage';
import ProductCard from '../components/ProductCard';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const [cartFeedback, setCartFeedback] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    trackPageView(`/products/${id}`);

    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data: Product) => {
        setProduct(data);
        setQuantity(1);
        setCartFeedback('');
        setSelectedVariantId('');
        setSelectedImageIndex(0);

        // Select first available variant or first variant
        if (data.variants && data.variants.length > 0) {
          const firstAvailable = data.variants.find((v) => v.available && v.stock > 0) || data.variants[0];
          setSelectedVariantId(firstAvailable.id);
        }

        // Fetch related products in the same category
        fetch('/api/products')
          .then((r) => r.json())
          .then((allProducts: Product[]) => {
            if (Array.isArray(allProducts)) {
              const related = allProducts
                .filter((p) => p.id !== data.id && (p.category === data.category || p.isFeatured))
                .slice(0, 3);
              setRelatedProducts(related);
            }
          });
      })
      .catch((err) => {
        console.error('Error fetching product detail:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-24 text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Fetching product formula details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-24 text-center px-4">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <ShieldAlert className="w-12 h-12 text-orange-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 font-sans">Product Not Found</h2>
            <p className="text-xs text-gray-500">
              The product you requested does not exist or may have been updated by the administrator.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-700/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  // Determine current active image
  const images = (product.images && product.images.length > 0)
    ? product.images
    : product.featuredImageUrl
    ? [{ id: '1', imageUrl: product.featuredImageUrl, altText: product.name, position: 0 }]
    : [{ id: '1', imageUrl: '', altText: product.name, position: 0 }];

  const activeImage = images[selectedImageIndex] || images[0];

  // Determine active variant
  const variants = product.variants || [];
  const activeVariant = variants.find((v) => v.id === selectedVariantId) || variants[0] || null;

  const currentPrice = activeVariant ? activeVariant.price : (product.price || 10000);
  const compareAtPrice = activeVariant?.compareAtPrice || null;
  const isAvailable = activeVariant ? (activeVariant.available && activeVariant.stock > 0) : product.available;
  const activeSizeName = activeVariant ? variantLabel(activeVariant) : 'Standard';

  const handleWhatsAppClick = () => {
    const link = getWhatsAppLink(product.name, quantity, activeSizeName);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-slate-50/50 min-h-screen py-10 sm:py-16 px-4 md:px-8" id="product-detail-view">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Navigation breadcrumb bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <nav className="flex items-center space-x-2 text-gray-500 font-medium">
            <Link to="/" className="hover:text-emerald-700 transition">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <Link to="/products" className="hover:text-emerald-700 transition">Catalog</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-bold truncate max-w-[200px]">{product.name}</span>
          </nav>

          <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 px-3.5 py-1 rounded-full font-bold">
            Category: {product.category}
          </span>
        </div>

        {/* Main Product Display Card */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-10">

          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Primary Image */}
            <div className="relative rounded-3xl overflow-hidden aspect-square bg-emerald-50/60 border border-emerald-100/60 group">
              <SafeImage
                src={activeImage.imageUrl}
                alt={activeImage.altText || product.name}
                placeholderText="NITA Product Image"
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
              />

              {product.isFeatured && (
                <div className="absolute top-4 left-4">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Featured Product</span>
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 bg-emerald-50/40 ${
                      selectedImageIndex === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                        : 'border-gray-200 hover:border-emerald-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <SafeImage
                      src={img.imageUrl}
                      alt={img.altText || `${product.name} thumb ${idx + 1}`}
                      placeholderText="Thumb"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Quality Standard Note */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100/60 text-left space-y-2">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>NITA Certified Quality Guarantee</span>
              </div>
              <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                Processed and aseptically packaged in our registered Tanzanian manufacturing plant adhering to TBS (Tanzania Bureau of Standards) food hygiene criteria.
              </p>
            </div>
          </div>

          {/* Right Column: Product Info & Purchase Controls */}
          <div className="lg:col-span-6 space-y-6 text-left flex flex-col justify-between">

            {/* Header info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 inline-block">
                  {product.category}
                </span>

                {/* Stock indicator badge */}
                {isAvailable ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    In Stock {activeVariant?.stock ? `(${activeVariant.stock} available)` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Out of Stock
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-sans tracking-tight leading-tight">
                {product.name}
              </h1>

              {product.shortDescription && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {/* Dynamic Price Display */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-emerald-900 font-sans">
                  {formatTZS(currentPrice)}
                </span>
                {compareAtPrice && compareAtPrice > currentPrice && (
                  <span className="text-base text-gray-400 line-through font-medium">
                    {formatTZS(compareAtPrice)}
                  </span>
                )}
                {compareAtPrice && compareAtPrice > currentPrice && (
                  <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                    Save {Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Dynamic Variants Selector */}
              {variants.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Select Package Size / Variant: <span className="text-emerald-800 font-extrabold">{activeSizeName}</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {variants.map((v) => {
                      const isSelected = v.id === selectedVariantId;
                      const inStock = v.available && v.stock > 0;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                          } ${!inStock ? 'opacity-50 line-through' : ''}`}
                        >
                          <span>{variantLabel(v)}</span>
                          <span className={isSelected ? 'text-emerald-200' : 'text-gray-400'}>
                            {formatTZS(v.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="pt-2 flex items-center space-x-4">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Quantity:
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 transition"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-xs font-extrabold text-emerald-950 min-w-[2rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(quantity + 1, activeVariant?.stock || 1))}
                    className="px-3.5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 transition"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  Total: <strong className="text-emerald-900 font-bold">{formatTZS(currentPrice * quantity)}</strong>
                </span>
              </div>
            </div>

            <p role="status" className="text-emerald-800">{cartFeedback}</p>
            {/* CTA Order Buttons */}
            <div className="space-y-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { try { addItem(product, selectedVariantId, quantity); setCartFeedback('Added to cart. Continue shopping or open your cart.'); } catch(e) { setCartFeedback((e as Error).message); } }}
                disabled={!isAvailable || !product.available || !selectedVariantId}
                className="w-full flex items-center justify-center gap-2.5 px-8 py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-700/20 transition hover:scale-[1.01]"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{isAvailable ? 'ADD TO CART' : 'Currently Out of Stock'}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="w-full flex items-center justify-center gap-2.5 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-orange-500/20 transition"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Order Directly via WhatsApp</span>
              </button>
            </div>

            {/* Additional Delivery & Trust Features */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 text-left">
              <div className="flex items-center space-x-2 text-gray-600 text-xs">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Express Dar & Nationwide Delivery</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Organic & TBS Certified</span>
              </div>
            </div>

          </div>

        </div>

        {/* Detailed Information Tabs / Panels */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 sm:p-10 space-y-8 text-left">
          <h2 className="text-xl font-extrabold text-emerald-950 font-sans tracking-tight border-b border-gray-100 pb-4">
            Product Specifications & Nutrition
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Description */}
            <div className="space-y-2 md:col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Detailed Description
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Ingredients */}
            <div className="space-y-2 md:col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center space-x-1.5">
                <ListPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pure Ingredients</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                {product.ingredients || '100% natural organic harvest sourced directly from Tanzanian smallholder farms.'}
              </p>
            </div>

            {/* Verified Benefits */}
            <div className="space-y-2 md:col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center space-x-1.5">
                <Heart className="w-3.5 h-3.5 text-orange-500 fill-orange-50" />
                <span>Health & Wellness Benefits</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                {product.benefits || 'Packed with natural essential fatty acids, clean protein, and micronutrients.'}
              </p>
            </div>
          </div>
        </div>

        {/* Recommended / Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-emerald-950 font-sans tracking-tight">
                You May Also Like
              </h3>
              <Link to="/products" className="text-xs font-bold text-emerald-700 hover:text-orange-500 transition">
                View All Products â†’
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relProd) => (
                <ProductCard key={relProd.id} product={relProd} />
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
