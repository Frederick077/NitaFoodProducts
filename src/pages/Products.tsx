import { matchesProductSearch, resolveCategory } from '../catalog';
import type { Category } from '../types';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types';
import { trackPageView } from '../utils';
import { getProductPresentation } from '../productPresentation';
import ProductCard from '../components/ProductCard';
import OrderModal from '../components/OrderModal';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [searchQuery, setSearchQuery] = useState(params.get('search') || '');
  const [sortBy, setSortBy] = useState('default');
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(() => window.matchMedia('(min-width: 1000px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1000px)');
    const update = () => setFiltersOpen(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const categoryQuery = params.get('categoryId') || params.get('category') || 'All';
  const selectedCategory = categoryQuery === 'All' ? undefined : resolveCategory(categories, categoryQuery);
  const [catalogRevision, setCatalogRevision] = useState(0);
  useEffect(() => { const update = () => setCatalogRevision(n => n + 1); window.addEventListener('nita-categories-changed', update); window.addEventListener('nita-products-changed', update); return () => { window.removeEventListener('nita-categories-changed', update); window.removeEventListener('nita-products-changed', update); }; }, []);
  const searchFromUrl = params.get('search') || '';
  useEffect(() => { setSearchQuery(searchFromUrl); }, [searchFromUrl]);
  const handleCategoryChange = (category: string) => {
    const next = new URLSearchParams(params);
    next.delete('category');
    if (category === 'All') next.delete('categoryId'); else next.set('categoryId', category);
    setParams(next);
  };
  useEffect(() => {
    trackPageView('/products');
    const controller = new AbortController();
    setLoading(true); setError('');
    fetch('/api/products', { signal: controller.signal }).then(async res => {
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error();
      if (!controller.signal.aborted) setProducts(data);
    }).catch(() => { if (!controller.signal.aborted) setError('Products could not be loaded. Please try again.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt, catalogRevision]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/categories', { signal: controller.signal }).then(async res => {
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error();
      setCategories(data); setCategoryError('');
    }).catch(() => { if (!controller.signal.aborted) setCategoryError('Categories are temporarily unavailable. You can still browse all products.'); });
    return () => controller.abort();
  }, [catalogRevision]);
  const sortedProducts = useMemo(() => products.filter(p => {
    return matchesProductSearch(p, searchQuery) &&
      (categoryQuery === 'All' || (selectedCategory ? p.categoryId === selectedCategory.id : p.category === categoryQuery));
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    const aPrice = getProductPresentation(a).price, bPrice = getProductPresentation(b).price;
    if (sortBy === 'price-low' || sortBy === 'price-high') {
      if (aPrice === null) return bPrice === null ? 0 : 1;
      if (bPrice === null) return -1;
      return sortBy === 'price-low' ? aPrice - bPrice : bPrice - aPrice;
    }
    return 0;
  }), [products, searchQuery, selectedCategory, categoryQuery, sortBy]);
  const reset = () => { setSearchQuery(''); setSortBy('default'); setParams({}); };
  const filtersActive = searchQuery || categoryQuery !== 'All' || sortBy !== 'default';
  return <div className="nita-catalog nita-page" id="products-catalog-page">
    <header className="nita-collection-heading"><h1>Our products</h1><p>Browse the NITA range. Select a product to see its pack sizes and details.</p></header>
    <div className="nita-page-inner nita-catalog-layout">
      <details className="nita-catalog-filters" open={filtersOpen} onToggle={event => setFiltersOpen(event.currentTarget.open)}>
        <summary>Filter products</summary>
        <div className="nita-filter-content">
          <div><label htmlFor="product-search-input">Search products</label><input id="product-search-input" type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search the range" /></div>
          <fieldset><legend>Category</legend>{categoryError && <p role="status">{categoryError}</p>}
            <div className="nita-category-list"><button type="button" aria-pressed={categoryQuery === 'All'} onClick={() => handleCategoryChange('All')}>All products<span>{products.length}</span></button>{categories.map(category => <button type="button" key={category.id} aria-pressed={selectedCategory?.id === category.id} onClick={() => handleCategoryChange(category.id)}>{category.name}<span>{products.filter(p => p.categoryId === category.id).length}</span></button>)}</div>
          </fieldset>
          {filtersActive && <button className="nita-plain-action" type="button" onClick={reset}>Clear filters</button>}
        </div>
      </details>
      <section className="nita-catalog-results" aria-label="Product results" aria-busy={loading}>
        <div className="nita-catalog-toolbar"><p role="status">{loading ? 'Loading products...' : error ? 'Products unavailable' : `${sortedProducts.length} ${sortedProducts.length === 1 ? 'product' : 'products'}`}</p>
          <label htmlFor="catalog-sort">Sort by <select id="catalog-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="default">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A-Z</option></select></label>
        </div>
        {loading ? <div className="nita-page-state" role="status">Loading the product range...</div> : error ? <div className="nita-page-state" role="alert"><p>{error}</p><button className="nita-contact-action" onClick={() => setAttempt(n => n + 1)}>Try again</button></div> : !sortedProducts.length ? <div className="nita-page-state"><h2>{products.length ? 'No matching products' : 'No products to display'}</h2><p>{products.length ? 'Try another search or clear your filters.' : 'Please check again later.'}</p>{filtersActive && <button className="nita-plain-action" onClick={reset}>Clear filters</button>}</div> :
          <div className="nita-product-grid nita-product-grid--catalog" data-count={sortedProducts.length}>{sortedProducts.map(product => <ProductCard key={product.id} product={product} onQuickOrder={setQuickOrderProduct} />)}</div>}
      </section>
    </div>
    {quickOrderProduct && <OrderModal product={quickOrderProduct} onClose={() => setQuickOrderProduct(null)} />}
  </div>;
}
