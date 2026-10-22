import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Menu,
  X,
  Search,
  User,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { siteSettings } from '../config/siteSettings';
import { Product } from '../types';

interface NavbarProps {
  isAdminLoggedIn?: boolean;
  onLogout?: () => void;
}

export default function Navbar({ isAdminLoggedIn = false, onLogout }: NavbarProps) {
  const { cartItems, openCart } = useCart();
  const itemCount = cartItems.length;
  const location = useLocation();
  const navigate = useNavigate();

  // Active dropdown states for desktop
  const [openDropdown, setOpenDropdown] = useState<'shop' | 'about' | 'explore' | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mobile menu and accordion states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileAccordions, setMobileAccordions] = useState<{
    shop: boolean;
    about: boolean;
    explore: boolean;
  }>({
    shop: false,
    about: false,
    explore: false,
  });

  // Dynamic Categories fetched from live PostgreSQL / Prisma database
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => {
      fetch('/api/products').then(res => res.json()).then(data => { if (Array.isArray(data)) setAllProducts(data); }).catch(() => {});
      fetch('/api/categories').then(res => res.json()).then(data => setDynamicCategories(Array.isArray(data) ? data.map(category => category.name) : [])).catch(() => setDynamicCategories([]));
    };
    refresh();
    window.addEventListener('nita-categories-changed', refresh);
    return () => window.removeEventListener('nita-categories-changed', refresh);
  }, [location.pathname]);

  // Handle Logo Click: smooth scroll to top if already on homepage
  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Dropdown hover helpers with delay bridge to prevent menu closing during cursor traversal
  const handleMouseEnter = (dropdown: 'shop' | 'about' | 'explore') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  };

  // Close menus on route change
  useEffect(() => {
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Auto focus search input when search modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isSearchOpen]);

  // Handle instant search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const filtered = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
    setSearchResults(filtered.slice(0, 6));
    setIsSearching(false);
  }, [searchQuery, allProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  // Toggle mobile accordion
  const toggleMobileAccordion = (section: 'shop' | 'about' | 'explore') => {
    setMobileAccordions((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isHomeActive = location.pathname === '/';
  const isShopActive = location.pathname.startsWith('/products');
  const isAboutActive = location.pathname.startsWith('/about') || location.pathname.startsWith('/quality');
  const isExploreActive = location.pathname.startsWith('/explore') || location.pathname.startsWith('/gallery');
  const isContactActive = location.pathname.startsWith('/contact');

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs"
        id="nita-public-header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* 1. NITA BRAND LOGO (Left) */}
            <Link
              to="/"
              onClick={handleLogoClick}
              className="flex items-center space-x-3 group select-none py-2"
              id="nita-brand-logo"
              aria-label="NITA FOOD PRODUCTS - Return to homepage"
            >
              {/* Brand Logo Emblem */}
              <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-800 text-white font-black text-lg shadow-sm shadow-emerald-900/20 group-hover:bg-emerald-900 group-hover:scale-105 transition-all duration-200">

                <img className="login-brand-mark" src="/assets/nita-logo.jpeg" alt="Nita Food Products logo" />
              </div>
              <div className="text-left">
                <span className="block text-lg sm:text-xl font-black tracking-tight text-emerald-950 font-sans leading-none">
                  Nita <span className="text-orange-500">Food</span>
                </span>
                <span className="block text-[9px] sm:text-[10px] uppercase tracking-widest text-emerald-800 font-bold mt-1">
                  Products
                </span>
              </div>
            </Link>

            {/* 2. DESKTOP NAVIGATION (Center Links) */}
            <nav
              className="hidden md:flex items-center space-x-1 lg:space-x-3"
              aria-label="Primary Navigation"
              id="desktop-main-navigation"
            >
              {/* Home */}
              <Link
                to="/"
                onClick={handleLogoClick}
                className={`px-3.5 py-2 text-sm font-semibold transition-colors duration-150 rounded-lg ${
                  isHomeActive
                    ? 'text-emerald-900 font-bold bg-emerald-50/70'
                    : 'text-gray-700 hover:text-emerald-800 hover:bg-emerald-50/50'
                }`}
                id="nav-link-home"
              >
                Home
              </Link>

              {/* Shop Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('shop')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className={`flex items-center gap-1 px-3.5 py-2 text-sm font-semibold transition-colors duration-150 rounded-lg focus:outline-none ${
                    isShopActive || openDropdown === 'shop'
                      ? 'text-emerald-900 font-bold bg-emerald-50/70'
                      : 'text-gray-700 hover:text-emerald-800 hover:bg-emerald-50/50'
                  }`}
                  aria-expanded={openDropdown === 'shop'}
                  aria-haspopup="true"
                  id="nav-dropdown-shop-btn"
                >
                  <span>Shop</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openDropdown === 'shop' ? 'transform rotate-180 text-orange-500' : 'text-gray-400'
                    }`}
                  />
                </button>

                {/* Shop Dropdown Menu: Clean links only, NO descriptions, NO bullets, NO numbering */}
                {openDropdown === 'shop' && (
                  <div
                    className="absolute left-0 top-full pt-1.5 min-w-[200px] z-50 animate-fade-in"
                    id="shop-dropdown-menu"
                  >
                    <ul className="bg-white rounded-2xl p-2 border border-emerald-100 shadow-xl shadow-emerald-950/10 list-none m-0 text-left space-y-0.5">
                      <li>
                        <Link
                          to="/products"
                          className="block px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-950 hover:bg-emerald-50 hover:text-emerald-800 transition"
                        >
                          Shop All
                        </Link>
                      </li>
                      {dynamicCategories.map((category) => (
                        <li key={category}>
                          <Link
                            to={`/products?category=${encodeURIComponent(category)}`}
                            className="block px-3.5 py-2 rounded-xl text-xs font-medium text-gray-700 hover:text-emerald-900 hover:bg-emerald-50 transition"
                          >
                            {category}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* About Us Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('about')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className={`flex items-center gap-1 px-3.5 py-2 text-sm font-semibold transition-colors duration-150 rounded-lg focus:outline-none ${
                    isAboutActive || openDropdown === 'about'
                      ? 'text-emerald-900 font-bold bg-emerald-50/70'
                      : 'text-gray-700 hover:text-emerald-800 hover:bg-emerald-50/50'
                  }`}
                  aria-expanded={openDropdown === 'about'}
                  aria-haspopup="true"
                  id="nav-dropdown-about-btn"
                >
                  <span>About Us</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openDropdown === 'about' ? 'transform rotate-180 text-orange-500' : 'text-gray-400'
                    }`}
                  />
                </button>

                {/* About Us Dropdown Menu: Clean links only, NO descriptions, NO bullets */}
                {openDropdown === 'about' && (
                  <div
                    className="absolute left-0 top-full pt-1.5 min-w-[200px] z-50 animate-fade-in"
                    id="about-dropdown-menu"
                  >
                    <ul className="bg-white rounded-2xl p-2 border border-emerald-100 shadow-xl shadow-emerald-950/10 list-none m-0 text-left space-y-0.5">
                      {siteSettings.navigation.aboutUs.map((item) => (
                        <li key={item.name}>
                          <Link
                            to={item.path}
                            className="block px-3.5 py-2 rounded-xl text-xs font-medium text-gray-700 hover:text-emerald-900 hover:bg-emerald-50 transition"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Explore Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('explore')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className={`flex items-center gap-1 px-3.5 py-2 text-sm font-semibold transition-colors duration-150 rounded-lg focus:outline-none ${
                    isExploreActive || openDropdown === 'explore'
                      ? 'text-emerald-900 font-bold bg-emerald-50/70'
                      : 'text-gray-700 hover:text-emerald-800 hover:bg-emerald-50/50'
                  }`}
                  aria-expanded={openDropdown === 'explore'}
                  aria-haspopup="true"
                  id="nav-dropdown-explore-btn"
                >
                  <span>Explore</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      openDropdown === 'explore' ? 'transform rotate-180 text-orange-500' : 'text-gray-400'
                    }`}
                  />
                </button>

                {/* Explore Dropdown Menu: Clean links only, NO descriptions, NO bullets */}
                {openDropdown === 'explore' && (
                  <div
                    className="absolute left-0 top-full pt-1.5 min-w-[200px] z-50 animate-fade-in"
                    id="explore-dropdown-menu"
                  >
                    <ul className="bg-white rounded-2xl p-2 border border-emerald-100 shadow-xl shadow-emerald-950/10 list-none m-0 text-left space-y-0.5">
                      {siteSettings.navigation.explore.map((item) => (
                        <li key={item.name}>
                          <Link
                            to={item.path}
                            className="block px-3.5 py-2 rounded-xl text-xs font-medium text-gray-700 hover:text-emerald-900 hover:bg-emerald-50 transition"
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Contact */}
              <Link
                to="/contact"
                className={`px-3.5 py-2 text-sm font-semibold transition-colors duration-150 rounded-lg ${
                  isContactActive
                    ? 'text-emerald-900 font-bold bg-emerald-50/70'
                    : 'text-gray-700 hover:text-emerald-800 hover:bg-emerald-50/50'
                }`}
                id="nav-link-contact"
              >
                Contact
              </Link>
            </nav>

            {/* 3. UTILITY ICONS & ADMIN PILL (Right Side) */}
            <div className="flex items-center space-x-1 sm:space-x-2">

              <button type="button" onClick={openCart} aria-haspopup="dialog" aria-label={`Cart, ${itemCount} items`} className="relative p-2 text-emerald-900"><ShoppingCart className="w-5 h-5" />{itemCount > 0 && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full px-1">{itemCount}</span>}</button>
              {/* Search Icon (Opens dynamic product search modal) */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 sm:p-2.5 rounded-full text-gray-700 hover:text-emerald-900 hover:bg-emerald-50 focus:outline-none transition"
                aria-label="Search NITA food products"
                id="navbar-search-btn"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* User / Profile Icon */}
              <Link
                to="/contact"
                className="p-2 sm:p-2.5 rounded-full text-gray-700 hover:text-emerald-900 hover:bg-emerald-50 focus:outline-none transition"
                aria-label="Customer inquiries and support"
                title="Customer Support"
                id="navbar-user-btn"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Optional Logged-in Admin Pill */}
              {isAdminLoggedIn && (
                <div className="hidden lg:flex items-center pl-2 ml-1 border-l border-gray-200 space-x-2">
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-extrabold hover:bg-orange-100 transition"
                    id="admin-active-badge"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
                    <span>Admin</span>
                  </Link>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5"
                    >
                      Logout
                    </button>
                  )}
                </div>
              )}

              {/* Mobile Hamburger Toggle Button */}
              <div className="flex items-center md:hidden pl-1">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-xl text-emerald-950 hover:bg-emerald-50 focus:outline-none border border-emerald-100"
                  aria-expanded={isMobileMenuOpen}
                  aria-label="Toggle main mobile menu"
                  id="mobile-menu-toggle-btn"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6 text-emerald-900" />
                  ) : (
                    <Menu className="w-6 h-6 text-emerald-900" />
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* 4. MOBILE ACCORDION DRAWER MENU */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden bg-white border-t border-emerald-100 px-4 pt-3 pb-8 space-y-2.5 shadow-2xl max-h-[85vh] overflow-y-auto text-left"
            id="mobile-nav-drawer"
          >
            {/* Home Link */}
            <Link
              to="/"
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`block px-4 py-3 rounded-xl text-sm font-bold transition ${
                isHomeActive ? 'bg-emerald-800 text-white shadow-sm' : 'text-gray-800 hover:bg-emerald-50'
              }`}
            >
              Home
            </Link>

            {/* Shop Accordion */}
            <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50/50">
              <button
                type="button"
                onClick={() => toggleMobileAccordion('shop')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-800 hover:bg-emerald-50/70 transition"
              >
                <span>Shop</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    mobileAccordions.shop ? 'transform rotate-180 text-emerald-700' : ''
                  }`}
                />
              </button>

              {mobileAccordions.shop && (
                <ul className="px-3 pb-2 pt-1 space-y-0.5 bg-white border-t border-gray-100 list-none m-0">
                  <li>
                    <Link
                      to="/products"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-50 rounded-lg"
                    >
                      Shop All
                    </Link>
                  </li>
                  {dynamicCategories.map((cat) => (
                    <li key={cat}>
                      <Link
                        key={cat}
                        to={`/products?category=${encodeURIComponent(cat)}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-2 text-xs font-medium text-gray-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg"
                      >
                        {cat}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* About Us Accordion */}
            <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50/50">
              <button
                type="button"
                onClick={() => toggleMobileAccordion('about')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-800 hover:bg-emerald-50/70 transition"
              >
                <span>About Us</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    mobileAccordions.about ? 'transform rotate-180 text-emerald-700' : ''
                  }`}
                />
              </button>

              {mobileAccordions.about && (
                <ul className="px-3 pb-2 pt-1 space-y-0.5 bg-white border-t border-gray-100 list-none m-0">
                  {siteSettings.navigation.aboutUs.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-2 text-xs font-medium text-gray-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Explore Accordion */}
            <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50/50">
              <button
                type="button"
                onClick={() => toggleMobileAccordion('explore')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-800 hover:bg-emerald-50/70 transition"
              >
                <span>Explore</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    mobileAccordions.explore ? 'transform rotate-180 text-orange-500' : ''
                  }`}
                />
              </button>

              {mobileAccordions.explore && (
                <ul className="px-3 pb-2 pt-1 space-y-0.5 bg-white border-t border-gray-100 list-none m-0">
                  {siteSettings.navigation.explore.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-2 text-xs font-medium text-gray-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Contact Link */}
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-sm font-bold transition ${
                isContactActive ? 'bg-emerald-800 text-white shadow-sm' : 'text-gray-800 hover:bg-emerald-50'
              }`}
            >
              Contact
            </Link>

            {/* If Logged-in Admin in Mobile */}
            {isAdminLoggedIn && (
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-50 border border-orange-200 text-orange-800 text-xs font-extrabold rounded-xl"
                >
                  <ShieldAlert className="w-4 h-4 text-orange-500" />
                  <span>Admin Dashboard</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 5. PRODUCT SEARCH MODAL */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 pt-20 animate-fade-in"
          onClick={() => setIsSearchOpen(false)}
          id="product-search-modal-overlay"
        >
          <div
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
            id="product-search-dialog"
          >
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center p-4 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 ml-2 mr-3 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search healthy seeds, granola, snacks..."
                className="w-full text-base sm:text-lg font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </form>

            {/* Live Search Results */}
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {searchQuery.trim() === '' ? (
                <div className="py-6 px-2 text-center text-gray-500 text-xs sm:text-sm">
                  <p className="font-semibold text-emerald-950">Search NITA Food Products</p>
                  <p className="mt-1 text-gray-400">Type product names or categories to quickly discover healthy foods.</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  <p>No products found matching "{searchQuery}"</p>
                  <Link
                    to="/products"
                    onClick={() => setIsSearchOpen(false)}
                    className="inline-block mt-3 text-xs font-bold text-emerald-800 hover:underline"
                  >
                    View All Products →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2">
                    Found {searchResults.length} Products
                  </p>
                  {searchResults.map((prod) => (
                    <Link
                      key={prod.id}
                      to={`/products/${prod.id}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-50/70 transition group border border-transparent hover:border-emerald-100"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100/60 flex items-center justify-center text-emerald-800 font-bold text-xs shrink-0 overflow-hidden">
                          {prod.featuredImageUrl || prod.image || prod.images?.[0]?.imageUrl ? (
                            <img
                              src={prod.featuredImageUrl || prod.image || prod.images?.[0]?.imageUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span>NITA</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-950">
                            {prod.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {prod.category} {prod.variants?.[0] ? `• ${prod.variants[0].size}` : ''}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
