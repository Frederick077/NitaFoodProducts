/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Gallery from './pages/Gallery';
import Quality from './pages/Quality';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';

// Helper component to auto-scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('nita_admin_token'));
  const [userRole, setUserRole] = useState<'Admin' | 'Manager' | null>(
    localStorage.getItem('nita_admin_role') as 'Admin' | 'Manager' | null
  );

  const handleLoginSuccess = (newToken: string, user: { name: string; email: string; role: 'Admin' | 'Manager' }) => {
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
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800" id="nita-app-container">
        {/* Scroll Helper */}
        <ScrollToTop />

        {/* Global Navbar */}
        <Navbar isAdminLoggedIn={!!token} onLogout={handleLogout} />

        {/* Main Content Viewport */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/quality" element={<Quality />} />
            <Route path="/contact" element={<Contact />} />
            <Route 
              path="/admin" 
              element={
                <AdminDashboard 
                  token={token} 
                  onLoginSuccess={handleLoginSuccess} 
                  userRole={userRole} 
                />
              } 
            />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </Router>
  );
}
