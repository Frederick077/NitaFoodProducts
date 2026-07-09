import React, { useEffect, useState } from 'react';
import { 
  Lock, 
  User, 
  BarChart3, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Edit3, 
  ClipboardCheck, 
  Image as ImageIcon, 
  MessageSquare, 
  Eye, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  ShieldAlert,
  Save,
  X,
  Smartphone,
  Layers,
  FileText
} from 'lucide-react';
import { Product, Order, GalleryItem, Message, AnalyticsSummary } from '../types';
import { formatTZS, trackPageView } from '../utils';
import SafeImage from '../components/SafeImage';

interface AdminDashboardProps {
  token: string | null;
  onLoginSuccess: (token: string, user: { name: string; email: string; role: 'Admin' | 'Manager' }) => void;
  userRole: 'Admin' | 'Manager' | null;
}

export default function AdminDashboard({ token, onLoginSuccess, userRole }: AdminDashboardProps) {
  // Login State
  const [email, setEmail] = useState('admin@nitafoods.co.tz');
  const [password, setPassword] = useState('nita2026');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Nav State
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'gallery' | 'messages'>('overview');

  // Database States
  const [stats, setStats] = useState<any>({
    visitors: 0,
    pageViews: {},
    popularProducts: {},
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Product Modals / Forms
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('Seeds & Nuts');
  const [prodPrice, setProdPrice] = useState(10000);
  const [prodImage, setProdImage] = useState('');
  const [prodSizes, setProdSizes] = useState('250g, 500g, 1kg');
  const [prodIngredients, setProdIngredients] = useState('');
  const [prodBenefits, setProdBenefits] = useState('');

  // Gallery Add Form State
  const [galImage, setGalImage] = useState('');
  const [galCategory, setGalCategory] = useState<'Products' | 'Packaging' | 'Production Process' | 'Company Events' | 'Customers'>('Products');

  useEffect(() => {
    trackPageView('/admin');
    if (token) {
      fetchAdminData();
    }
  }, [token, activeTab]);

  const fetchAdminData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Stats
      const statsRes = await fetch('/api/analytics', { headers });
      const statsData = await statsRes.json();
      if (!statsData.error) setStats(statsData);

      // Products
      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();
      if (!prodData.error) setProducts(prodData);

      // Orders
      const ordRes = await fetch('/api/orders', { headers });
      const ordData = await ordRes.json();
      if (!ordData.error) setOrders(ordData);

      // Gallery
      const galRes = await fetch('/api/gallery');
      const galData = await galRes.json();
      if (!galData.error) setGallery(galData);

      // Messages
      const msgRes = await fetch('/api/messages', { headers });
      const msgData = await msgRes.json();
      if (!msgData.error) setMessages(msgData);

    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.token, data.user);
      } else {
        setLoginError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setLoginError('Server communication error.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- PRODUCT MANAGEMENT ACTIONS ---
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodDesc || !prodPrice) return;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: prodName,
          description: prodDesc,
          category: prodCategory,
          price: prodPrice,
          image: prodImage || '',
          sizes: prodSizes.split(',').map(s => s.trim()),
          ingredients: prodIngredients,
          benefits: prodBenefits
        })
      });

      if (res.ok) {
        setIsAddingProduct(false);
        resetProductForm();
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: prodName,
          description: prodDesc,
          category: prodCategory,
          price: prodPrice,
          image: prodImage,
          sizes: prodSizes.split(',').map(s => s.trim()),
          ingredients: prodIngredients,
          benefits: prodBenefits
        })
      });

      if (res.ok) {
        setEditingProduct(null);
        resetProductForm();
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (userRole === 'Manager') {
      alert('Action Denied: Only Admin role can delete products.');
      return;
    }
    if (!window.confirm('Are you absolutely sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProductClick = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdCategory(p.category);
    setProdPrice(p.price);
    setProdImage(p.image);
    setProdSizes(p.sizes.join(', '));
    setProdIngredients(p.ingredients);
    setProdBenefits(p.benefits);
  };

  const resetProductForm = () => {
    setProdName('');
    setProdDesc('');
    setProdCategory('Seeds & Nuts');
    setProdPrice(10000);
    setProdImage('');
    setProdSizes('250g, 500g, 1kg');
    setProdIngredients('');
    setProdBenefits('');
  };

  // --- ORDER PROCESSING ---
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- GALLERY ACTIONS ---
  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galImage) return;

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ image: galImage, category: galCategory })
      });

      if (res.ok) {
        setGalImage('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (userRole === 'Manager') {
      alert('Action Denied: Only Admin role can delete gallery items.');
      return;
    }
    if (!window.confirm('Delete this gallery image?')) return;

    try {
      const res = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // RENDER LOGIN SCREEN
  // ==========================================
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-24 px-4 sm:px-6 lg:px-8" id="admin-login-screen">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-[32px] border border-gray-100 shadow-xl text-left">
          
          <div className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">
                Secure Portal Login
              </h2>
              <p className="text-xs text-gray-500">
                Staff portal for NITA Food Products administrator
              </p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="admin@nitafoods.co.tz"
                />
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 rounded-xl transition duration-200 shadow-md shadow-emerald-50"
            >
              <span>{isLoggingIn ? 'Verifying...' : 'Authenticate'}</span>
            </button>
          </form>

          {/* Seed Testing accounts Helper */}
          <div className="pt-6 border-t border-gray-100 space-y-2 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
              Testing accounts
            </span>
            <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-500 text-left pt-2">
              <div 
                onClick={() => { setEmail('admin@nitafoods.co.tz'); setPassword('nita2026'); }}
                className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 hover:border-emerald-200 cursor-pointer transition"
              >
                <p className="font-bold text-emerald-950">Role: Admin</p>
                <p className="font-mono text-[10px] mt-0.5">admin@nitafoods.co.tz</p>
                <p className="font-mono text-[10px]">Pass: nita2026</p>
              </div>
              <div 
                onClick={() => { setEmail('manager@nitafoods.co.tz'); setPassword('nita2026'); }}
                className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 hover:border-emerald-200 cursor-pointer transition"
              >
                <p className="font-bold text-emerald-950">Role: Manager</p>
                <p className="font-mono text-[10px] mt-0.5">manager@nitafoods.co.tz</p>
                <p className="font-mono text-[10px]">Pass: nita2026</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER AUTHENTICATED ADMIN PANEL
  // ==========================================
  return (
    <div className="bg-gray-50/50 min-h-screen text-left" id="authenticated-admin-portal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Welcome row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-6 mb-8 gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-sans tracking-tight">
              Administrative Dashboard
            </h1>
            <p className="text-xs text-gray-500">
              Logged in as: <span className="font-bold text-emerald-700">{userRole}</span> (Authorization Granted)
            </p>
          </div>

          {/* Quick Tab Select */}
          <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-2xl border border-gray-200/50">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'products', label: 'Products', icon: ShoppingBag },
              { id: 'orders', label: 'Orders', icon: ClipboardCheck },
              { id: 'gallery', label: 'Gallery', icon: ImageIcon },
              { id: 'messages', label: 'Messages', icon: MessageSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                    activeTab === tab.id
                      ? 'bg-white text-emerald-900 shadow-sm border border-gray-200/20'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8" id="overview-dashboard-view">
            
            {/* Counts Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              
              {/* Total Products */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Products</span>
                  <span className="text-xl font-bold text-gray-900 font-sans">{stats.totalProducts}</span>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Orders</span>
                  <span className="text-xl font-bold text-gray-900 font-sans">{stats.totalOrders}</span>
                </div>
              </div>

              {/* Total Sales */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Sales</span>
                  <span className="text-xl font-bold text-gray-900 font-sans">{formatTZS(stats.totalSales || 0)}</span>
                </div>
              </div>

              {/* Visitors */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Visitors</span>
                  <span className="text-xl font-bold text-gray-900 font-sans">{stats.visitors}</span>
                </div>
              </div>

            </div>

            {/* Popular Products & Traffic Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Popular Products */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-gray-900 flex items-center space-x-1.5 border-b border-gray-100 pb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Popular Products View Count</span>
                </h3>
                <div className="space-y-3.5">
                  {Object.entries(stats.popularProducts || {}).map(([pId, count]: any) => {
                    const prod = products.find(p => p.id === pId);
                    return (
                      <div key={pId} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700 truncate max-w-[250px]">
                          {prod ? prod.name : `Product ID: ${pId}`}
                        </span>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-extrabold rounded-lg">
                          {count} views
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Most Visited Pages */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-gray-900 flex items-center space-x-1.5 border-b border-gray-100 pb-2">
                  <Layers className="w-4 h-4 text-orange-500" />
                  <span>Most Visited Website Pages</span>
                </h3>
                <div className="space-y-3.5">
                  {Object.entries(stats.pageViews || {}).map(([page, count]: any) => (
                    <div key={page} className="flex justify-between items-center text-xs">
                      <span className="font-mono text-gray-600 font-semibold">{page}</span>
                      <span className="px-3 py-1 bg-orange-50 text-orange-800 font-extrabold rounded-lg">
                        {count} hits
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 2. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-8" id="products-dashboard-view">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-emerald-950 font-sans tracking-tight">
                Product Catalog Management
              </h3>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  resetProductForm();
                  setIsAddingProduct(true);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Product Add or Edit Modal Overlays */}
            {(isAddingProduct || editingProduct) && (
              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/60 text-xs">
                <div className="flex justify-between items-center border-b border-emerald-100 pb-3 mb-5">
                  <h4 className="font-extrabold text-sm text-emerald-950">
                    {editingProduct ? `Edit ${editingProduct.name}` : 'Create Brand New Product'}
                  </h4>
                  <button
                    onClick={() => {
                      setIsAddingProduct(false);
                      setEditingProduct(null);
                    }}
                    className="p-1 rounded-full bg-white text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={editingProduct ? handleEditProductSubmit : handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Product Title</label>
                    <input 
                      type="text" required value={prodName} onChange={e => setProdName(e.target.value)}
                      className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2"
                      placeholder="e.g. NITA Cashew Nuts"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Price (TZS)</label>
                    <input 
                      type="number" required value={prodPrice} onChange={e => setProdPrice(Number(e.target.value))}
                      className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Category</label>
                    <select 
                      value={prodCategory} onChange={e => setProdCategory(e.target.value)}
                      className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2"
                    >
                      <option value="Seeds & Nuts">Seeds & Nuts</option>
                      <option value="Snacks & Energy Bars">Snacks & Energy Bars</option>
                      <option value="Other Premium Products">Other Premium Products</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Image URL</label>
                    <input 
                      type="text" value={prodImage} onChange={e => setProdImage(e.target.value)}
                      className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2"
                      placeholder="Paste Unsplash or static image URL"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Available Sizes (comma separated)</label>
                    <input 
                      type="text" value={prodSizes} onChange={e => setProdSizes(e.target.value)}
                      className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2"
                      placeholder="150g, 250g, 500g"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">Description</label>
                    <textarea 
                      required rows={3} value={prodDesc} onChange={e => setProdDesc(e.target.value)}
                      className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2"
                      placeholder="Type a highly engaging description..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">Honest Ingredients</label>
                    <textarea 
                      rows={2} value={prodIngredients} onChange={e => setProdIngredients(e.target.value)}
                      className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2"
                      placeholder="e.g. 100% natural sunflower seeds."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">Specific Benefits</label>
                    <textarea 
                      rows={2} value={prodBenefits} onChange={e => setProdBenefits(e.target.value)}
                      className="w-full bg-white rounded-lg border border-gray-200 px-3 py-2"
                      placeholder="e.g. Rich in vitamin E, regulates sugar..."
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end space-x-2">
                    <button 
                      type="button" onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingProduct ? 'Save Product' : 'Add Product'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
                    <th className="p-4 text-left">Preview</th>
                    <th className="p-4 text-left">Product Title</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-left">Base Price</th>
                    <th className="p-4 text-left">Pack Sizes</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <SafeImage 
                          src={p.image} alt={p.name} placeholderText="No Image" className="w-10 h-10 object-cover rounded-lg bg-gray-100"
                        />
                      </td>
                      <td className="p-4 font-bold text-gray-900">{p.name}</td>
                      <td className="p-4 text-gray-600 font-medium">{p.category}</td>
                      <td className="p-4 font-bold text-emerald-800">{formatTZS(p.price)}</td>
                      <td className="p-4 text-gray-500">{p.sizes.join(', ')}</td>
                      <td className="p-4 flex items-center justify-center space-x-2 pt-6">
                        <button
                          onClick={() => handleEditProductClick(p)}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-8" id="orders-dashboard-view">
            <h3 className="font-bold text-lg text-emerald-950 font-sans tracking-tight">
              Order Dispatch Management
            </h3>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
                    <th className="p-4 text-left">Order Ref</th>
                    <th className="p-4 text-left">Customer</th>
                    <th className="p-4 text-left">Phone</th>
                    <th className="p-4 text-left">Product</th>
                    <th className="p-4 text-left">Pack Size</th>
                    <th className="p-4 text-left">Qty</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-mono font-bold text-emerald-800">{o.id}</td>
                      <td className="p-4 font-bold text-gray-900">{o.customerName}</td>
                      <td className="p-4 text-gray-600 font-medium flex items-center space-x-1">
                        <Smartphone className="w-3 h-3 text-gray-400" />
                        <span>{o.phone}</span>
                      </td>
                      <td className="p-4 text-gray-600 font-semibold">{o.productName}</td>
                      <td className="p-4 text-gray-500">{o.size}</td>
                      <td className="p-4 text-gray-900 font-bold">{o.quantity}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          o.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                          o.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="bg-white rounded-lg border border-gray-200 p-1 text-[10px] font-semibold"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div className="space-y-8" id="gallery-dashboard-view">
            <h3 className="font-bold text-lg text-emerald-950 font-sans tracking-tight">
              Gallery Control Center
            </h3>

            {/* Gallery Upload Form */}
            <div className="bg-emerald-50/40 p-6 rounded-3xl border border-emerald-100/40">
              <h4 className="font-bold text-xs text-emerald-900 mb-4 uppercase tracking-wider">
                Upload Image Asset to Gallery
              </h4>
              <form onSubmit={handleAddGalleryItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Image URL</label>
                  <input
                    type="text" required value={galImage} onChange={e => setGalImage(e.target.value)}
                    className="w-full bg-white rounded-lg border border-gray-200 p-2 text-xs"
                    placeholder="Enter Image URL (e.g., Cloudinary)..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Gallery Category</label>
                  <select
                    value={galCategory} onChange={e => setGalCategory(e.target.value as any)}
                    className="w-full bg-white rounded-lg border border-gray-200 p-2 text-xs"
                  >
                    <option value="Products">Products</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Production Process">Production Process</option>
                    <option value="Company Events">Company Events</option>
                    <option value="Customers">Customers</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                >
                  Confirm Upload
                </button>
              </form>
            </div>

            {/* Grid of gallery assets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {gallery.map((item) => (
                <div key={item.id} className="relative bg-white rounded-xl overflow-hidden border border-gray-100 group">
                  <SafeImage 
                    src={item.image} alt="Gallery item" placeholderText="No Image" className="w-full h-36 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteGalleryItem(item.id)}
                      className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50"
                      title="Delete Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2.5 text-[10px] font-bold text-gray-500 bg-gray-50 border-t border-gray-100">
                    {item.category}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* 5. MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-8" id="messages-dashboard-view">
            <h3 className="font-bold text-lg text-emerald-950 font-sans tracking-tight">
              Customer Contact Messages
            </h3>

            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                  <p className="text-gray-400 text-xs">No client inquiries found in database.</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-950">{m.name}</h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{m.email} | {m.phone || 'No Phone'}</p>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-full">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-sans">{m.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
