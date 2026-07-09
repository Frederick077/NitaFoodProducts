import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, CornerDownRight } from 'lucide-react';
import { Product } from '../types';
import { trackPageView, formatTZS } from '../utils';
import SafeImage from '../components/SafeImage';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default'); // 'default', 'price-low', 'price-high'
  const navigate = useNavigate();

  useEffect(() => {
    trackPageView('/products');

    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) => console.error('Error loading products:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filter and Search logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sorting logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0; // Default sorting by creation index
  });

  // Extract unique categories for filter tabs
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  return (
    <div className="bg-white min-h-screen" id="products-catalog-page">
      {/* Header section */}
      <section className="relative py-16 bg-emerald-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage 
            src="" 
            alt="Pumpkin seed peeled header" 
            placeholderText="Upload Products Catalog Banner"
            className="w-full h-full object-cover opacity-15 filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 to-emerald-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-orange-400 text-xs font-bold uppercase tracking-widest bg-emerald-900 px-3.5 py-1.5 rounded-full border border-emerald-800 inline-block">
            NITA Food Catalog
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-sans">
            Our Nutritional Products
          </h1>
          <p className="text-emerald-200/80 text-sm sm:text-base max-w-xl mx-auto">
            100% natural, hygienic food products processed from selected local agriculture with complete health guarantees.
          </p>
        </div>
      </section>

      {/* Catalog Main Body */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar: Controls & Filters */}
          <div className="lg:col-span-1 space-y-8 text-left">
            {/* Search */}
            <div className="space-y-2.5">
              <label className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                <Search className="w-4 h-4 text-emerald-700" />
                <span>Search Products</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Pumpkin, Honey, Seeds..."
                  className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-gray-200 text-sm focus:border-emerald-500 focus:ring-emerald-500 placeholder:text-gray-400"
                  id="product-search-input"
                />
                <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Categories filter */}
            <div className="space-y-3.5">
              <label className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                <Filter className="w-4 h-4 text-emerald-700" />
                <span>Filter Category</span>
              </label>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl text-left border transition ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-50'
                        : 'bg-white text-gray-700 border-gray-100 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Sorting */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                <ArrowUpDown className="w-4 h-4 text-emerald-700" />
                <span>Sort Options</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="default">Default Order</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Right Area: Catalog Grid */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Loading Indicator */}
            {loading ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500 font-medium">Fetching fresh products catalog...</p>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="py-24 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 space-y-4">
                <p className="text-gray-400 font-medium text-sm">No food products found matching your active filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSortBy('default');
                  }}
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                    id={`product-card-${product.id}`}
                  >
                    {/* Visual head */}
                    <div className="relative overflow-hidden h-52 bg-emerald-50">
                      <SafeImage
                        src={product.image}
                        alt={product.name}
                        placeholderText="Upload Product Image"
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute top-3.5 left-3.5 bg-emerald-600/90 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                        {product.category}
                      </div>
                    </div>

                    {/* Content body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-left">
                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900 text-base group-hover:text-emerald-700 transition line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                        
                        {/* Sizes list preview */}
                        <div className="pt-2 flex flex-wrap gap-1">
                          {product.sizes.map((s) => (
                            <span 
                              key={s} 
                              className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md border border-gray-200/50"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Footer bar */}
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-widest">Base Price</span>
                          <span className="text-emerald-800 font-black text-sm">
                            {formatTZS(product.price)}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 text-xs font-bold rounded-xl transition duration-200 flex items-center space-x-1"
                        >
                          <span>View Product</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
