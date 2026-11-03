import { educationalHubLinks } from '../data/educationalHub';
import { matchesProductSearch } from '../catalog';
import type { Category } from '../types';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronDown, Menu, X, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { siteSettings } from '../config/siteSettings';
import type { Product } from '../types';

type Dropdown = 'shop' | 'explore' | 'education';

export default function Navbar() {
  const { itemCount, openCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<Dropdown | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileAccordions, setMobileAccordions] = useState<Record<Dropdown, boolean>>({ shop: false, explore: false, education: false });
  const [dynamicCategories, setDynamicCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchDialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      fetch('/api/products').then(res => res.json()).then(data => { if (!cancelled && Array.isArray(data)) setAllProducts(data); }).catch(() => {});
      fetch('/api/categories').then(res => res.json()).then(data => { if (!cancelled) setDynamicCategories(Array.isArray(data) ? data : []); }).catch(() => { if (!cancelled) setDynamicCategories([]); });
    };
    refresh();
    window.addEventListener('nita-categories-changed', refresh);
    window.addEventListener('nita-products-changed', refresh);
    return () => { cancelled = true; window.removeEventListener('nita-categories-changed', refresh); window.removeEventListener('nita-products-changed', refresh); };
  }, [location.pathname]);

  useEffect(() => {
    setOpenDropdown(null); setIsMobileMenuOpen(false); setIsSearchOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const dialog = searchDialog.current;
    if (!dialog || !isSearchOpen) return;
    dialog.showModal(); searchInput.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = originalOverflow; searchTrigger.current?.focus({ preventScroll: true }); };
  }, [isSearchOpen]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) { setOpenDropdown(null); setIsMobileMenuOpen(false); } };
    const media = window.matchMedia('(min-width: 1024px)');
    const closeOnResize = () => { setIsMobileMenuOpen(false); setOpenDropdown(null); };
    document.addEventListener('pointerdown', closeOutside);
    media.addEventListener('change', closeOnResize);
    return () => { document.removeEventListener('pointerdown', closeOutside); media.removeEventListener('change', closeOnResize); if (closeTimer.current) clearTimeout(closeTimer.current); };
  }, []);

  const groups = [
    { key: 'shop' as const, label: 'Shop', active: location.pathname.startsWith('/products'), items: [{ name: 'Shop all', path: '/products' }, ...dynamicCategories.map(category => ({ name: category.name, path: `/products?categoryId=${encodeURIComponent(category.id)}` }))] },
    { key: 'about' as const, label: 'About Us', path: '/about', active: location.pathname.startsWith('/about') },
    { key: 'explore' as const, label: 'Explore', active: location.pathname.startsWith('/explore') || location.pathname.startsWith('/gallery'), items: siteSettings.navigation.explore },
    { key: 'education' as const, label: 'Educational Hub', path: '/educational-hub', active: location.pathname.startsWith('/educational-hub'), items: educationalHubLinks },
  ];
  const query = searchQuery.trim().toLowerCase();
  const searchResults = query ? allProducts.filter(product => matchesProductSearch(product, query)).slice(0, 6) : [];
  const returnHome = () => {
    setIsMobileMenuOpen(false);
    if (location.pathname === '/') window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const menuKeyDown = (event: KeyboardEvent<HTMLDivElement>, key: Dropdown) => {
    if (event.key === 'Escape') { setOpenDropdown(null); event.currentTarget.querySelector('button')?.focus(); }
    if (event.key === 'ArrowDown' && (event.target === event.currentTarget.querySelector('button') || event.target === event.currentTarget.querySelector('[data-dropdown-landing]'))) {
      event.preventDefault(); setOpenDropdown(key);
      const container = event.currentTarget;
      requestAnimationFrame(() => container.querySelector<HTMLElement>('.nita-nav-dropdown a')?.focus());
    }
  };
  const isCurrent = (path: string) => path.includes('?') || path.includes('#') ? path === location.pathname + location.search + location.hash : path === location.pathname && !location.search && !location.hash;

  return <>
    <header className="nita-navigation" id="nita-public-header" ref={header}
      onKeyDown={event => { if (event.key === 'Escape' && isMobileMenuOpen) { setIsMobileMenuOpen(false); header.current?.querySelector<HTMLButtonElement>('#mobile-menu-toggle-btn')?.focus(); } }}>
      <div className="nita-nav-inner">
        <Link to="/" className="nita-brand" id="nita-brand-logo" onClick={returnHome} aria-label="NITA Food Products — home">
          <img src="/assets/nita-logo-transparent.png" alt="NITA Food Products" width="164" height="72" />
        </Link>
        <nav className="nita-nav-desktop" id="desktop-main-navigation" aria-label="Primary navigation">
          {groups.map(group => group.key === 'about' ? <Link key={group.key} to={group.path} className={`nita-nav-link ${group.active ? 'is-active' : ''}`} aria-current={location.pathname === '/about' ? 'page' : undefined} id="nav-link-about">About Us</Link> : <div className="nita-nav-disclosure" key={group.key}
            onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpenDropdown(group.key); }}
            onMouseLeave={() => { closeTimer.current = setTimeout(() => { if (!header.current?.querySelector(`#${group.key}-dropdown-menu`)?.parentElement?.contains(document.activeElement)) setOpenDropdown(null); }, 180); }}
            onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenDropdown(null); }}
            onKeyDown={event => menuKeyDown(event, group.key)}>
            {group.key === 'education' ? <div className="nita-nav-split">
              <Link to={group.path} data-dropdown-landing className={`nita-nav-link ${group.active ? 'is-active' : ''}`} aria-current={isCurrent(group.path) ? 'page' : undefined}>Educational Hub</Link>
              <button type="button" className="nita-education-toggle" id="nav-dropdown-education-btn" aria-label="Educational Hub subpages" aria-expanded={openDropdown === 'education'} aria-controls="education-dropdown-menu" onClick={() => setOpenDropdown(previous => previous === 'education' ? null : 'education')}><ChevronDown size={14} aria-hidden="true" /></button>
            </div> : <button type="button" className={`nita-nav-link ${group.active ? 'is-active' : ''}`} aria-expanded={openDropdown === group.key} aria-controls={`${group.key}-dropdown-menu`}
              id={`nav-dropdown-${group.key}-btn`} onClick={() => setOpenDropdown(previous => previous === group.key ? null : group.key)}>
              {group.label}<ChevronDown size={14} aria-hidden="true" />
            </button>}
            {openDropdown === group.key && <div className="nita-nav-dropdown" id={`${group.key}-dropdown-menu`}><ul>{group.items.map(item => <li key={item.path}>
              <Link to={item.path} aria-current={isCurrent(item.path) ? 'page' : undefined} onClick={() => setOpenDropdown(null)}>{item.name}</Link>
            </li>)}</ul></div>}
          </div>)}
          <Link to="/contact" className={`nita-nav-link ${location.pathname === '/contact' ? 'is-active' : ''}`} aria-current={location.pathname === '/contact' ? 'page' : undefined} id="nav-link-contact">Contact</Link>
        </nav>
        <div className="nita-nav-tools">
          <button type="button" className="nita-icon-button" onClick={openCart} aria-haspopup="dialog" aria-label={`Cart, ${itemCount} items`}><ShoppingCart size={20} aria-hidden="true" />{itemCount > 0 && <span className="nita-cart-count">{itemCount}</span>}</button>
          <button type="button" className="nita-icon-button" ref={searchTrigger} id="navbar-search-btn" aria-label="Search NITA food products" aria-haspopup="dialog" onClick={() => { setSearchQuery(''); setIsSearchOpen(true); }}><Search size={20} aria-hidden="true" /></button>
          <button type="button" className="nita-icon-button nita-mobile-toggle" id="mobile-menu-toggle-btn" aria-label={isMobileMenuOpen ? 'Close main menu' : 'Open main menu'} aria-expanded={isMobileMenuOpen} aria-controls="mobile-nav-drawer"
            onClick={() => setIsMobileMenuOpen(previous => !previous)}>{isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {isMobileMenuOpen && <nav className="nita-mobile-nav" id="mobile-nav-drawer" aria-label="Mobile navigation" onKeyDown={event => { if (event.key === 'Escape') { setIsMobileMenuOpen(false); header.current?.querySelector<HTMLButtonElement>('#mobile-menu-toggle-btn')?.focus(); } }}>
        {groups.map(group => group.key === 'about' ? <Link key={group.key} to={group.path} onClick={() => setIsMobileMenuOpen(false)} aria-current={location.pathname === '/about' ? 'page' : undefined} id="mobile-nav-link-about">About Us</Link> : <div key={group.key}>
          {group.key === 'education' && <Link to={group.path} onClick={() => setIsMobileMenuOpen(false)} aria-current={isCurrent(group.path) ? 'page' : undefined}>Educational Hub</Link>}
          <button type="button" aria-label={group.key === 'education' ? 'Educational Hub subpages' : undefined} aria-expanded={mobileAccordions[group.key]} aria-controls={`mobile-${group.key}-links`} onClick={() => setMobileAccordions(previous => ({ ...previous, [group.key]: !previous[group.key] }))}>{group.key === 'education' ? 'Explore topics' : group.label}<ChevronDown size={16} aria-hidden="true" /></button>
          {mobileAccordions[group.key] && <ul id={`mobile-${group.key}-links`}>{group.items.map(item => <li key={item.path}><Link to={item.path} aria-current={isCurrent(item.path) ? 'page' : undefined} onClick={() => setIsMobileMenuOpen(false)}>{item.name}</Link></li>)}</ul>}
        </div>)}
        <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} aria-current={location.pathname === '/contact' ? 'page' : undefined}>Contact</Link>
      </nav>}
    </header>
    <dialog className="nita-search" ref={searchDialog} id="product-search-dialog" aria-label="Search NITA products" onCancel={() => setIsSearchOpen(false)}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setIsSearchOpen(false); } }}
      onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setIsSearchOpen(false); } }}>
      <form className="nita-search-form" onSubmit={event => { event.preventDefault(); if (query) { navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`); setIsSearchOpen(false); } }}>
        <Search size={20} aria-hidden="true" /><label className="sr-only" htmlFor="nita-product-search">Search products</label>
        <input ref={searchInput} id="nita-product-search" type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search products or categories" />
        <button type="button" className="nita-icon-button" aria-label="Close search" onClick={() => setIsSearchOpen(false)}><X size={20} /></button>
      </form>
      <div className="nita-search-results">
        <p role="status">{!query ? 'Search by product name or category.' : !searchResults.length ? `No products found for “${searchQuery}”.` : `${searchResults.length} matching products`}</p>
        {searchResults.map(product => <Link key={product.id} className="nita-search-result" to={`/products/${product.id}`} onClick={() => setIsSearchOpen(false)}>
          {(product.featuredImageUrl || product.image || product.images?.[0]?.imageUrl) && <img src={product.featuredImageUrl || product.image || product.images?.[0]?.imageUrl} alt="" />}
          <span><strong>{product.name}</strong><br />{product.category}{product.variants?.[0] ? ` · ${product.variants[0].size}` : ''}</span>
        </Link>)}
        {query && <Link className="nita-nav-link" to={`/products?search=${encodeURIComponent(searchQuery.trim())}`} onClick={() => setIsSearchOpen(false)}>View all results</Link>}
      </div>
    </dialog>
  </>;
}
