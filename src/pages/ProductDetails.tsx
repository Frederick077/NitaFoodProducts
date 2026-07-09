import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ListPlus, Heart, Award, ShieldAlert, ShoppingBag, ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { trackPageView, formatTZS } from '../utils';
import OrderModal from '../components/OrderModal';
import SafeImage from '../components/SafeImage';

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    trackPageView(`/products/${id}`);

    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data) => {
        setProduct(data);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-24 text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Extracting product formula details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-24 text-center px-4">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <ShieldAlert className="w-12 h-12 text-orange-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 font-sans">Product Not Found</h2>
            <p className="text-xs text-gray-500">
              The product code you requested does not exist or may have been deleted by the administrator.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen py-16 px-4 md:px-8" id="product-detail-view">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation back bar */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center space-x-2 text-sm font-semibold text-emerald-800 hover:text-emerald-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </button>

          <span className="text-xs text-gray-400 bg-white border border-gray-100 px-3.5 py-1 rounded-full font-semibold">
            Category: {product.category}
          </span>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 p-6 sm:p-10">
          
          {/* Left Column: Image Area */}
          <div className="md:col-span-5 space-y-4">
            <div className="relative rounded-2xl overflow-hidden aspect-square bg-emerald-50 border border-emerald-100/50">
              <SafeImage
                src={product.image}
                alt={product.name}
                placeholderText="Upload Product Image"
                className="w-full h-full object-cover shadow-sm hover:scale-[1.01] transition duration-300"
              />
            </div>
            
            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/30 text-left space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>NITA Hygiene Standard</span>
              </div>
              <p className="text-[11px] text-emerald-700/80 leading-relaxed">
                Processed, packed, and sealed in our sterile food-handling facility following local Bureau of Standards (TBS) criteria. Guaranteed chemical-free.
              </p>
            </div>
          </div>

          {/* Right Column: Information details */}
          <div className="md:col-span-7 space-y-8 text-left flex flex-col justify-between">
            
            {/* Title & Core info */}
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-emerald-950 font-sans tracking-tight">
                {product.name}
              </h1>
              
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-widest">Pricing</span>
                <span className="text-2xl font-black text-emerald-700 font-sans">
                  {formatTZS(product.price)}
                </span>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-widest mb-2">Available Pack Sizes</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => (
                    <span
                      key={sz}
                      className="px-3.5 py-1.5 bg-gray-100 text-gray-800 text-xs font-semibold rounded-lg border border-gray-200"
                    >
                      {sz}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Description Tab list */}
            <div className="space-y-6 pt-4 border-t border-gray-100">
              {/* Description */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Product Description
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Ingredients */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center space-x-1.5">
                  <ListPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Honest Ingredients</span>
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.ingredients}
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center space-x-1.5">
                  <Heart className="w-3.5 h-3.5 text-orange-500 fill-orange-50" />
                  <span>Verified Nutritional Benefits</span>
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.benefits}
                </p>
              </div>
            </div>

            {/* Buy Action Panel */}
            <div className="pt-8 border-t border-gray-100">
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/20 transition hover:scale-[1.01]"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Order Product Now</span>
              </button>
            </div>

          </div>

        </div>

        {/* Nutritional Quality Affirmation banner */}
        <div className="bg-emerald-800 text-emerald-50 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="space-y-2 max-w-xl">
            <h4 className="font-bold text-base text-white">
              Sourced Directly, Handled Hygienically
            </h4>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              We form long-term agreements with small-scale farming families in Tanzania. They adhere to clean growing practices, and we reward them with transparent, higher-than-average margins.
            </p>
          </div>
          <Link
            to="/quality"
            className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold rounded-xl border border-emerald-700/50 whitespace-nowrap"
          >
            Our Quality Standards
          </Link>
        </div>

      </div>

      {/* Product Order Form Modal */}
      {isOrderModalOpen && (
        <OrderModal
          product={product}
          onClose={() => setIsOrderModalOpen(false)}
        />
      )}
    </div>
  );
}
