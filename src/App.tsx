import EducationalHub, { AcademyAlias } from './pages/EducationalHub';
import { CartProvider } from './context/CartContext';
import Checkout from './pages/Cart';
import CartModal from './components/CartModal';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import CompanyRedirect from './components/CompanyRedirect';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Explore from './pages/Explore';
import AdminDashboard from './pages/AdminDashboard';

// Helper component to auto-scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [pathname]);

  return null;
}

function SiteFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <div className={`flex flex-col min-h-screen bg-slate-50 text-slate-800 ${pathname.startsWith('/admin') ? '' : 'nita-public'}`} id="nita-app-container">{children}</div>;
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('nita_admin_token'));
  const [userRole, setUserRole] = useState<'Admin' | null>(
    localStorage.getItem('nita_admin_role') as 'Admin' | null
  );

  const handleLoginSuccess = (newToken: string, user: { name: string; email: string; role: 'Admin' }) => {
    setToken(newToken);
    setUserRole(user.role);
    localStorage.setItem('nita_admin_token', newToken);
    localStorage.setItem('nita_admin_role', user.role);
  };

  const handleLogout = () => {
    setToken(null);
    setUserRole(null);
    localStorage.removeItem('nita_admin_token');
    localStorage.removeItem('nita_admin_role');
  };

  return (
    <CartProvider><Router>
      <SiteFrame>
        {/* Scroll Helper */}
        <ScrollToTop />

        {/* Global Navbar */}
        <Navbar />

        {/* Main Content Viewport */}
        <main className="flex-grow">
          <Routes>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/about/our-story" element={<CompanyRedirect section="story" />} />
            <Route path="/about/sustainability" element={<CompanyRedirect section="community" />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/quality" element={<CompanyRedirect section="production" />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/explore/recipes" element={<Explore />} />
            <Route path="/explore/news" element={<Navigate replace to="/explore" />} />
            <Route path="/explore/faqs" element={<Explore />} />
            <Route path="/explore/stockists" element={<Explore />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/education" element={<AcademyAlias />} />
            <Route path="/education/:topic" element={<AcademyAlias />} />
            <Route path="/educational-hub" element={<EducationalHub />} />
            <Route path="/educational-hub/:topic" element={<EducationalHub />} />
            <Route
              path="/admin"
              element={
                <AdminDashboard
                  token={token}
                  onLoginSuccess={handleLoginSuccess}
                  onLogout={handleLogout}
                  userRole={userRole}
                />
              }
            />
            <Route
              path="/admin/login"
              element={
                <AdminDashboard
                  token={token}
                  onLoginSuccess={handleLoginSuccess}
                  onLogout={handleLogout}
                  userRole={userRole}
                />
              }
            />
          </Routes>
        </main>

        {/* Floating WhatsApp Action Button */}
        <FloatingWhatsApp />

        {/* Global Footer */}
        <Footer />
      <CartModal />
      </SiteFrame>
    </Router></CartProvider>
  );
}
