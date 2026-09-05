import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingCart, MessageSquare, AlertCircle } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { getWhatsAppLink, formatTZS } from '../utils';
import SafeImage from './SafeImage';

interface OrderModalProps {
  product: Product;
  initialVariantId?: string;
  onClose: () => void;
}

export default function OrderModal({ product, initialVariantId, onClose }: OrderModalProps) {
  const variants = product.variants || [];
  
  // Default to initialVariantId, or first available variant, or first variant
  const defaultVariant = variants.find((v) => v.id === initialVariantId) || 
    variants.find((v) => v.available && v.stock > 0) || 
    variants[0] || 
    null;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(defaultVariant ? defaultVariant.id : '');
  const [selectedSize, setSelectedSize] = useState<string>(defaultVariant ? defaultVariant.size : (product.sizes?.[0] || '250g'));
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Selected variant object
  const currentVariant = variants.find((v) => v.id === selectedVariantId) || defaultVariant;
  const currentPrice = currentVariant ? currentVariant.price : (product.price || 10000);
  const isAvailable = currentVariant ? (currentVariant.available && currentVariant.stock > 0) : product.available;

  const handleVariantChange = (varId: string) => {
    setSelectedVariantId(varId);
    const v = variants.find((item) => item.id === varId);
    if (v) {
      setSelectedSize(v.size || v.name);
    }
  };

  const handleSizeChange = (sz: string) => {
    setSelectedSize(sz);
    const matchingVar = variants.find((v) => v.size === sz);
    if (matchingVar) {
      setSelectedVariantId(matchingVar.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          phone,
          productId: product.id,
          quantity,
          size: selectedSize,
          notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrderId(data.id);
        setIsSuccess(true);
      } else {
        console.error('Failed to submit order to database');
      }
    } catch (error) {
      console.error('Order network error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    const link = getWhatsAppLink(product.name, quantity, selectedSize);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const totalCost = currentPrice * quantity;
  const primaryImage = product.featuredImageUrl || (product.images && product.images[0]?.imageUrl) || product.image || '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="order-modal-container">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-emerald-50">
          
          {/* Close button */}
          <div className="absolute right-4 top-4 z-10">
            <button
              onClick={onClose}
              className="rounded-full bg-gray-100 p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-sans leading-tight">
                    Order Placement
                  </h3>
                  <p className="text-xs text-gray-500">
                    Place your official order or connect with sales on WhatsApp
                  </p>
                </div>
              </div>

              {/* Product Preview Card */}
              <div className="flex items-center space-x-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0">
                  <SafeImage
                    src={primaryImage}
                    alt={product.name}
                    placeholderText="Product"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-emerald-950 truncate">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Unit Price: <span className="font-bold text-emerald-800">{formatTZS(currentPrice)}</span>
                  </p>
                  <p className="text-xs font-bold text-orange-600 mt-0.5">
                    Total: {formatTZS(totalCost)}
                  </p>
                </div>
              </div>

              {/* Variant / Size & Quantity Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Pack Size / Variant
                  </label>
                  {variants.length > 0 ? (
                    <select
                      value={selectedVariantId}
                      onChange={(e) => handleVariantChange(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.size || v.name} - {formatTZS(v.price)} {!v.available || v.stock <= 0 ? '(Out of Stock)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedSize}
                      onChange={(e) => handleSizeChange(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    >
                      {(product.sizes || ['250g', '500g', '1kg']).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {!isAvailable && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <span>The selected variant is currently out of stock. Please pick another size or contact us.</span>
                </div>
              )}

              {/* Customer Contact Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Amina Juma"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Phone Number (WhatsApp Active) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +255 712 345 678"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Delivery Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Deliver to Kinondoni, Dar es Salaam"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !customerName || !phone || !isAvailable}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 rounded-xl transition duration-200 shadow-md shadow-emerald-700/20"
                >
                  <span>{isSubmitting ? 'Recording Order...' : 'Submit Order'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const defaultName = customerName || 'Customer';
                    const defaultPhone = phone || 'None';

                    // Track in DB silently
                    fetch('/api/orders', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customerName: defaultName,
                        phone: defaultPhone,
                        productId: product.id,
                        quantity,
                        size: selectedSize,
                        notes,
                      }),
                    }).catch(() => {});

                    handleWhatsAppRedirect();
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-700 fill-emerald-700" />
                  <span>Order Directly via WhatsApp</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 font-sans">
                  Order Submitted Successfully!
                </h3>
                <p className="text-sm text-gray-500">
                  Your Order Reference is: <span className="font-mono font-bold text-emerald-700">{orderId}</span>
                </p>
                <p className="text-xs text-gray-400 leading-relaxed px-4">
                  We have successfully saved your order in our database. Our sales team will contact you at <span className="font-medium text-gray-700">{phone}</span> shortly.
                </p>
              </div>

              <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-100 text-left space-y-2">
                <span className="inline-block px-2.5 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Recommended Next Step
                </span>
                <p className="text-xs text-orange-950 leading-relaxed">
                  Send your order confirmation to our official WhatsApp sales desk for immediate priority packaging and dispatch tracking.
                </p>
                <button
                  onClick={handleWhatsAppRedirect}
                  className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition shadow-md shadow-orange-500/20"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-white" />
                  <span>Send WhatsApp Message Now</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
                >
                  Close Window
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
