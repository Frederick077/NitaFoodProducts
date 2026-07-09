import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}

export default function Navbar({ isAdminLoggedIn, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Products', path: '/products' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Quality Standards', path: '/quality' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-emerald-100 shadow-sm" id="main-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2" id="logo-link">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-xl shadow-md shadow-emerald-200">
                <span className="text-orange-400">N</span>I
              </div>
              <div>
                <span className="block text-xl font-bold tracking-tight text-emerald-800">
                  NITA <span className="text-orange-500">FOOD</span>
                </span>
                <span className="block text-[10px] uppercase tracking-widest text-emerald-600 font-semibold leading-none">
                  Products Ltd
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg hover:bg-emerald-50/50 ${
                  isActive(link.path)
                    ? 'text-emerald-700 font-semibold'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
                id={`nav-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-orange-500 rounded-full" />
                )}
              </Link>
            ))}

            {isAdminLoggedIn ? (
              <div className="flex items-center pl-4 border-l border-gray-100 space-x-2">
                <Link
                  to="/admin"
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full hover:bg-orange-100 transition"
                  id="admin-dashboard-btn"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition"
                >
                  Log Out
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-emerald-800 hover:bg-emerald-50 focus:outline-none"
              aria-expanded="false"
              id="mobile-menu-toggle"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-emerald-100 shadow-inner px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-medium transition ${
                isActive(link.path)
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {link.name}
            </Link>
          ))}
          {isAdminLoggedIn && (
            <div className="pt-4 border-t border-gray-100 space-y-2 px-2">
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 text-sm font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-xl"
              >
                <ShieldAlert className="w-4 h-4 text-orange-500" />
                <span>Admin Dashboard</span>
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full text-center px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
