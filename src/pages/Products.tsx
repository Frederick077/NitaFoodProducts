import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { trackPageView } from '../utils';
import SafeImage from '../components/SafeImage';
import ProductCard from '../components/ProductCard';
import OrderModal from '../components/OrderModal';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || 'All';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('default'); // 'default', 'price-low', 'price-high', 'name'
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);

  // Sync state if URL query param changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    } else {
      setSelectedCategory('All');
    }
  }, [searchParams]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'All') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: cat });
    }
  };

  useEffect(() => {
    trackPageView('/products');

    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) => console.error('Error loading products catalog:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filter logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q) ||
        (p.ingredients && p.ingredients.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

      const isAvailable = p.available !== false && (!p.variants || p.variants.some((v) => v.available && v.stock > 0));
      const matchesStock = !onlyInStock || isAvailable;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, onlyInStock]);

  // Sorting logic
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [filteredProducts, sortBy]);

  // Extract unique categories
  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ['All', ...unique];
  }, [products]);

  const handleResetFilters = () => {
    setSearchQuery('');
    handleCategoryChange('All');
    setOnlyInStock(false);
    setSortBy('default');
  };

  return (
    <div className="bg-slate-50/50 min-h-screen" id="products-catalog-page">
      {/* Header section */}
      <section className="relative py-16 sm:py-20 bg-emerald-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage 
            src="" 
            alt="NITA Food Products Catalog" 
            placeholderText="Upload Products Catalog Banner"
            className="w-full h-full object-cover opacity-15 filter brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 to-emerald-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-orange-400 text-xs font-extrabold uppercase tracking-widest bg-emerald-900 px-3.5 py-1.5 rounded-full border border-emerald-800 inline-block">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar: Controls & Filters */}
          <div className="lg:col-span-1 space-y-6 text-left">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              
              {/* Search */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center space-x-1.5">
                  <Search className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Search Products</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search seeds, granola..."
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-emerald-500 focus:ring-emerald-500 placeholder:text-gray-400 bg-gray-50/50"
                    id="product-search-input"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Categories filter */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center space-x-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Categories</span>
                </label>
                <div className="flex flex-wrap lg:flex-col gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl text-left border transition flex items-center justify-between ${
                        selectedCategory === cat
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-100 hover:bg-emerald-50 hover:text-emerald-800'
                      }`}
                    >
                      <span>{cat}</span>
                      {cat !== 'All' && (
                        <span className={`text-[10px] ${selectedCategory === cat ? 'text-emerald-200' : 'text-gray-400'}`}>
                          {products.filter((p) => p.category === cat).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Filter */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                  Availability
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span>In-stock only</span>
                </label>
              </div>

              {/* Price Sorting */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center space-x-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Sort By</span>
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-medium focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="default">Featured / Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Product Name (A-Z)</option>
                </select>
              </div>

              {/* Reset Action */}
              {(searchQuery || selectedCategory !== 'All' || onlyInStock || sortBy !== 'default') && (
                <button
                  onClick={handleResetFilters}
                  className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-emerald-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              )}

            </div>
          </div>

          {/* Right Area: Catalog Grid */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Header stats bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>
                Showing <strong className="text-emerald-950 font-bold">{sortedProducts.length}</strong> {sortedProducts.length === 1 ? 'product' : 'products'}
              </span>
              {selectedCategory !== 'All' && (
                <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">
                  Category: {selectedCategory}
                </span>
              )}
            </div>

            {/* Loading Skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-3xl p-5 border border-gray-100 animate-pulse space-y-4">
                    <div className="h-48 bg-gray-100 rounded-2xl" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-10 bg-gray-100 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-4 px-4">
                <p className="text-gray-500 font-medium text-sm">No food products match your active search or filter criteria.</p>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-700/20"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickOrder={(p) => setQuickOrderProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Quick Order Modal */}
      {quickOrderProduct && (
        <OrderModal
          product={quickOrderProduct}
          onClose={() => setQuickOrderProduct(null)}
        />
      )}
    </div>
  );
}
