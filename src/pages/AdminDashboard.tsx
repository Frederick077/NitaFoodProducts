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
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Product, ProductVariant, ProductImage, Order, GalleryItem, Message } from '../types';
import { formatTZS, trackPageView } from '../utils';
import SafeImage from '../components/SafeImage';
import ImageUploader from '../components/ImageUploader';
import ImageManagementSection from '../components/admin/ImageManagementSection';

interface AdminDashboardProps {
  token: string | null;
  onLoginSuccess: (token: string, user: { name: string; email: string; role: 'Admin' }) => void;
  userRole: 'Admin' | null;
}

interface VariantFormState {
  id?: string;
  name: string;
  size: string;
  price: number;
  compareAtPrice: number | '';
  available: boolean;
  stock: number;
  sku: string;
}

interface ImageFormState {
  id?: string;
  imageUrl: string;
  altText: string;
  position: number;
}

export default function AdminDashboard({ token, onLoginSuccess, userRole }: AdminDashboardProps) {
  // Login State
  const [email, setEmail] = useState('admin@nitafoods.local');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Nav State
  const [activeTab, setActiveTab] = useState<'overview' | 'images' | 'products' | 'orders' | 'gallery' | 'messages'>('overview');

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

  // Product Modals / Forms State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  
  // Product Form Fields
  const [prodName, setProdName] = useState('');
  const [prodSlug, setProdSlug] = useState('');
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('Seeds & Nuts');
  const [prodFeaturedImage, setProdFeaturedImage] = useState('');
  const [prodFeaturedPublicId, setProdFeaturedPublicId] = useState('');
  const [prodAvailable, setProdAvailable] = useState(true);
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodIngredients, setProdIngredients] = useState('');
  const [prodBenefits, setProdBenefits] = useState('');
  const [prodImages, setProdImages] = useState<ImageFormState[]>([]);
  const [prodVariants, setProdVariants] = useState<VariantFormState[]>([
    { name: '250g Pouch', size: '250g', price: 10000, compareAtPrice: '', available: true, stock: 50, sku: '' }
  ]);

  // Gallery Add Form State
  const [galImage, setGalImage] = useState('');
  const [galPublicId, setGalPublicId] = useState('');
  const [galTitle, setGalTitle] = useState('');
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

  // --- PRODUCT FORM HELPERS ---
  const resetProductForm = () => {
    setProdName('');
    setProdSlug('');
    setProdShortDesc('');
    setProdDesc('');
    setProdCategory('Seeds & Nuts');
    setProdFeaturedImage('');
    setProdFeaturedPublicId('');
    setProdAvailable(true);
    setProdIsFeatured(false);
    setProdIngredients('');
    setProdBenefits('');
    setProdImages([]);
    setProdVariants([
      { name: '250g Pouch', size: '250g', price: 10000, compareAtPrice: '', available: true, stock: 50, sku: '' }
    ]);
  };

  const handleEditProductClick = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSlug(p.slug || '');
    setProdShortDesc(p.shortDescription || '');
    setProdDesc(p.description);
    setProdCategory(p.category);
    setProdFeaturedImage(p.featuredImageUrl || p.image || '');
    setProdFeaturedPublicId(p.featuredImagePublicId || '');
    setProdAvailable(p.available !== false);
    setProdIsFeatured(Boolean(p.isFeatured));
    setProdIngredients(p.ingredients || '');
    setProdBenefits(p.benefits || '');

    // Set images
    if (p.images && p.images.length > 0) {
      setProdImages(p.images.map((img, idx) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        altText: img.altText || '',
        position: img.position ?? idx
      })));
    } else if (p.featuredImageUrl || p.image) {
      setProdImages([{ imageUrl: p.featuredImageUrl || p.image || '', altText: p.name, position: 0 }]);
    } else {
      setProdImages([]);
    }

    // Set variants
    if (p.variants && p.variants.length > 0) {
      setProdVariants(p.variants.map(v => ({
        id: v.id,
        name: v.name,
        size: v.size,
        price: v.price,
        compareAtPrice: v.compareAtPrice || '',
        available: v.available,
        stock: v.stock,
        sku: v.sku || ''
      })));
    } else {
      setProdVariants(p.sizes.map((s, idx) => ({
        name: s,
        size: s,
        price: p.price || 10000,
        compareAtPrice: '',
        available: true,
        stock: 50,
        sku: `SKU-${idx}`
      })));
    }
  };

  // Add Variant Row
  const handleAddVariantRow = () => {
    setProdVariants([
      ...prodVariants,
      {
        name: `Pack Size ${prodVariants.length + 1}`,
        size: '500g',
        price: 15000,
        compareAtPrice: '',
        available: true,
        stock: 50,
        sku: ''
      }
    ]);
  };

  // Remove Variant Row
  const handleRemoveVariantRow = (index: number) => {
    if (prodVariants.length <= 1) return;
    setProdVariants(prodVariants.filter((_, i) => i !== index));
  };

  // Update Variant Row
  const handleUpdateVariantField = (index: number, field: keyof VariantFormState, value: any) => {
    const updated = [...prodVariants];
    updated[index] = { ...updated[index], [field]: value };
    setProdVariants(updated);
  };

  // Add Image Row
  const handleAddImageRow = () => {
    setProdImages([
      ...prodImages,
      { imageUrl: '', altText: prodName, position: prodImages.length }
    ]);
  };

  // Remove Image Row
  const handleRemoveImageRow = (index: number) => {
    setProdImages(prodImages.filter((_, i) => i !== index));
  };

  // Update Image Row
  const handleUpdateImageField = (index: number, field: keyof ImageFormState, value: any) => {
    const updated = [...prodImages];
    updated[index] = { ...updated[index], [field]: value };
    setProdImages(updated);
  };

  // Submit Product Form (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodDesc || prodVariants.length === 0) return;

    setIsSavingProduct(true);
    try {
      const payload = {
        name: prodName,
        slug: prodSlug || undefined,
        shortDescription: prodShortDesc,
        description: prodDesc,
        category: prodCategory,
        featuredImageUrl: prodFeaturedImage || (prodImages[0]?.imageUrl || ''),
        featuredImagePublicId: prodFeaturedPublicId || '',
        available: prodAvailable,
        isFeatured: prodIsFeatured,
        ingredients: prodIngredients,
        benefits: prodBenefits,
        images: prodImages.filter(img => img.imageUrl.trim() !== ''),
        variants: prodVariants.map(v => ({
          name: v.name || v.size,
          size: v.size || v.name,
          price: Number(v.price) || 0,
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          available: v.available,
          stock: Number(v.stock) || 0,
          sku: v.sku || ''
        }))
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsAddingProduct(false);
        setEditingProduct(null);
        resetProductForm();
        fetchAdminData();
      }
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) return;

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

  // --- ORDER STATUS UPDATE ---
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
        body: JSON.stringify({
          title: galTitle || 'NITA Photo',
          image: galImage,
          imageUrl: galImage,
          storagePublicId: galPublicId || '',
          category: galCategory
        })
      });

      if (res.ok) {
        setGalImage('');
        setGalPublicId('');
        setGalTitle('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
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
                  placeholder="admin@nitafoods.local"
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
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 rounded-xl transition duration-200 shadow-md shadow-emerald-700/20"
            >
              <span>{isLoggingIn ? 'Verifying...' : 'Authenticate'}</span>
            </button>
          </form>

          {/* Seed Testing account Helper */}
          <div className="pt-6 border-t border-gray-100 space-y-2 text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Administrator Access
            </span>
            <div className="text-[11px] text-gray-500 text-left pt-2">
              <div 
                onClick={() => { setEmail('admin@nitafoods.local'); setPassword('admin123'); }}
                className="bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-emerald-200 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-emerald-950">Role: Admin</p>
                  <p className="font-mono text-[10px] mt-0.5 text-gray-600">Email: admin@nitafoods.local</p>
                  <p className="font-mono text-[10px] text-gray-600">Pass: admin123</p>
                </div>
                <span className="text-xs text-emerald-600 font-medium bg-white px-2.5 py-1 rounded-lg border border-emerald-100 shadow-xs">
                  Autofill
                </span>
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
              Role: <span className="font-bold text-emerald-700">{userRole}</span> (PostgreSQL & Prisma Backend)
            </p>
          </div>

          {/* Quick Tab Select */}
          <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-2xl border border-gray-200/50">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'images', label: 'Image Management', icon: Sparkles },
              { id: 'products', label: 'Products & Variants', icon: ShoppingBag },
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

        {/* IMAGE MANAGEMENT SYSTEM TAB (5 Groups) */}
        {activeTab === 'images' && (
          <ImageManagementSection
            token={token}
            products={products}
            gallery={gallery}
            onRefreshData={fetchAdminData}
          />
        )}

        {/* 2. PRODUCTS & VARIANTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-8" id="products-dashboard-view">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-emerald-950 font-sans tracking-tight">
                  Product Catalog & Variant System
                </h3>
                <p className="text-xs text-gray-500">
                  Manage rich products with multiple high-res images and size/price variants
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  resetProductForm();
                  setIsAddingProduct(true);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-700/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Product Add or Edit Modal Overlays */}
            {(isAddingProduct || editingProduct) && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-200 shadow-lg text-xs space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <div>
                    <h4 className="font-extrabold text-base text-emerald-950">
                      {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create Brand New Dynamic Product'}
                    </h4>
                    <p className="text-[11px] text-gray-500">Configure core product details, gallery images, and size/price variants</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddingProduct(false);
                      setEditingProduct(null);
                    }}
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-8">
                  {/* Section A: Core Info */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-900 border-b border-gray-100 pb-1">
                      1. General Details
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Product Title *</label>
                        <input 
                          type="text" required value={prodName} onChange={e => setProdName(e.target.value)}
                          className="w-full bg-gray-50/50 rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-emerald-500"
                          placeholder="e.g. NITA Roasted Pumpkin Seeds"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Category *</label>
                        <select 
                          value={prodCategory} onChange={e => setProdCategory(e.target.value)}
                          className="w-full bg-gray-50/50 rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-emerald-500"
                        >
                          <option value="Seeds & Nuts">Seeds & Nuts</option>
                          <option value="Snacks & Energy Bars">Snacks & Energy Bars</option>
                          <option value="Organic Grains">Organic Grains</option>
                          <option value="Other Premium Products">Other Premium Products</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Custom Slug (Optional)</label>
                        <input 
                          type="text" value={prodSlug} onChange={e => setProdSlug(e.target.value)}
                          className="w-full bg-gray-50/50 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-mono"
                          placeholder="auto-generated-from-name"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <ImageUploader
                          token={token}
                          currentImageUrl={prodFeaturedImage}
                          category="products"
                          label="Primary Featured Product Image"
                          recommendedDimensions="Square 800x800 recommended"
                          onUploadSuccess={({ imageUrl, publicId }) => {
                            setProdFeaturedImage(imageUrl);
                            setProdFeaturedPublicId(publicId);
                          }}
                          onRemove={() => {
                            setProdFeaturedImage('');
                            setProdFeaturedPublicId('');
                          }}
                        />
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">or Direct URL:</span>
                          <input 
                            type="text" value={prodFeaturedImage} onChange={e => setProdFeaturedImage(e.target.value)}
                            className="flex-1 bg-gray-50/50 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px]"
                            placeholder="https://... or auto-filled upon upload"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-gray-700 mb-1">Short Description (1-2 sentences for cards)</label>
                        <input 
                          type="text" value={prodShortDesc} onChange={e => setProdShortDesc(e.target.value)}
                          className="w-full bg-gray-50/50 rounded-xl border border-gray-200 px-3.5 py-2 text-xs"
                          placeholder="Brief highlight of the product..."
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-gray-700 mb-1">Full Detailed Description *</label>
                        <textarea 
                          required rows={3} value={prodDesc} onChange={e => setProdDesc(e.target.value)}
                          className="w-full bg-gray-50/50 rounded-xl border border-gray-200 px-3.5 py-2 text-xs"
                          placeholder="Comprehensive description of harvesting, taste, and packaging..."
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Ingredients</label>
                        <textarea 
                          rows={2} value={prodIngredients} onChange={e => setProdIngredients(e.target.value)}
                          className="w-full bg-gray-50/50 rounded-xl border border-gray-200 px-3.5 py-2 text-xs"
                          placeholder="100% natural Tanzanian pumpkin seeds..."
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Health Benefits</label>
                        <textarea 
                          rows={2} value={prodBenefits} onChange={e => setProdBenefits(e.target.value)}
                          className="w-full bg-gray-50/50 rounded-xl border border-gray-200 px-3.5 py-2 text-xs"
                          placeholder="High in zinc, magnesium, antioxidants..."
                        />
                      </div>

                      <div className="flex items-center space-x-6 sm:col-span-2 pt-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prodAvailable}
                            onChange={(e) => setProdAvailable(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <span className="font-bold text-gray-800">Product Available in Store</span>
                        </label>

                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prodIsFeatured}
                            onChange={(e) => setProdIsFeatured(e.target.checked)}
                            className="w-4 h-4 text-orange-500 rounded"
                          />
                          <span className="font-bold text-gray-800">Show in Featured Homepage Section</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Multiple Images */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                      <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                        2. Image Gallery (Multiple Angles & Packaging)
                      </h5>
                      <button
                        type="button"
                        onClick={handleAddImageRow}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[11px] font-bold flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Gallery Image</span>
                      </button>
                    </div>

                    {prodImages.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic">No additional gallery images added yet. The primary featured image will be used.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {prodImages.map((img, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200/60">
                            <span className="text-[10px] font-bold text-gray-400 w-5">#{idx + 1}</span>
                            <input
                              type="text"
                              value={img.imageUrl}
                              onChange={(e) => handleUpdateImageField(idx, 'imageUrl', e.target.value)}
                              placeholder="Image URL..."
                              className="flex-1 bg-white rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
                            />
                            <input
                              type="text"
                              value={img.altText}
                              onChange={(e) => handleUpdateImageField(idx, 'altText', e.target.value)}
                              placeholder="Alt text / Description..."
                              className="w-1/3 bg-white rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImageRow(idx)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section C: Product Variants (Shopify-Style Sizes & Prices) */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                      <div>
                        <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                          3. Product Variants (Sizes, Pricing & Stock)
                        </h5>
                        <p className="text-[10px] text-gray-500">Each product can have multiple pack sizes with distinct pricing and stock</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVariantRow}
                        className="px-3 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Size / Variant</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {prodVariants.map((v, idx) => (
                        <div key={idx} className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100 grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">Variant Name / Size</label>
                            <input
                              type="text"
                              required
                              value={v.size}
                              onChange={(e) => {
                                handleUpdateVariantField(idx, 'size', e.target.value);
                                handleUpdateVariantField(idx, 'name', e.target.value);
                              }}
                              placeholder="e.g. 250g Pouch"
                              className="w-full bg-white rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">Price (TZS) *</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={v.price}
                              onChange={(e) => handleUpdateVariantField(idx, 'price', Number(e.target.value))}
                              className="w-full bg-white rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-emerald-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">Compare Price</label>
                            <input
                              type="number"
                              min="0"
                              value={v.compareAtPrice}
                              onChange={(e) => handleUpdateVariantField(idx, 'compareAtPrice', e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="e.g. 12000"
                              className="w-full bg-white rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">Stock Qty</label>
                            <input
                              type="number"
                              min="0"
                              value={v.stock}
                              onChange={(e) => handleUpdateVariantField(idx, 'stock', Number(e.target.value))}
                              className="w-full bg-white rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">SKU Code</label>
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => handleUpdateVariantField(idx, 'sku', e.target.value)}
                              placeholder="SKU-XXX"
                              className="w-full bg-white rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-mono"
                            />
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 pt-4 sm:pt-0">
                            <label className="flex items-center space-x-1.5 cursor-pointer text-[10px]">
                              <input
                                type="checkbox"
                                checked={v.available}
                                onChange={(e) => handleUpdateVariantField(idx, 'available', e.target.checked)}
                                className="rounded text-emerald-600"
                              />
                              <span className="font-semibold text-gray-700">Active</span>
                            </label>
                            
                            <button
                              type="button"
                              disabled={prodVariants.length <= 1}
                              onClick={() => handleRemoveVariantRow(idx)}
                              className="p-1.5 text-red-500 hover:text-red-700 disabled:opacity-30"
                              title="Delete Variant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                    <button 
                      type="button" onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
                      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSavingProduct}
                      className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md shadow-emerald-700/20"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingProduct ? 'Saving to Database...' : (editingProduct ? 'Save Product Changes' : 'Create Product')}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="font-bold text-gray-900">All Database Products ({products.length})</span>
                <span>Click edit to manage variants, prices, and high-res image sets</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
                      <th className="p-4 text-left">Preview</th>
                      <th className="p-4 text-left">Product Title & Category</th>
                      <th className="p-4 text-left">Price Range</th>
                      <th className="p-4 text-left">Active Variants & Sizes</th>
                      <th className="p-4 text-left">Stock Summary</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((p) => {
                      const variants = p.variants || [];
                      const prices = variants.length > 0 ? variants.map(v => v.price) : [p.price || 0];
                      const minPrice = Math.min(...prices);
                      const maxPrice = Math.max(...prices);
                      const totalStock = variants.length > 0 ? variants.reduce((sum, v) => sum + (v.stock || 0), 0) : 50;

                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="p-4">
                            <SafeImage 
                              src={p.featuredImageUrl || (p.images && p.images[0]?.imageUrl) || p.image || ''} 
                              alt={p.name} 
                              placeholderText="No Image" 
                              className="w-12 h-12 object-cover rounded-xl bg-gray-100 shadow-xs"
                            />
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold mt-1 inline-block">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-emerald-900">
                            {minPrice === maxPrice ? formatTZS(minPrice) : `${formatTZS(minPrice)} - ${formatTZS(maxPrice)}`}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {variants.length > 0 ? (
                                variants.map((v) => (
                                  <span key={v.id} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">
                                    {v.size || v.name}: {formatTZS(v.price)}
                                  </span>
                                ))
                              ) : (
                                p.sizes.map((s) => (
                                  <span key={s} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                    {s}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-gray-700">
                            {totalStock} units
                          </td>
                          <td className="p-4">
                            {p.available !== false ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Disabled
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleEditProductClick(p)}
                                className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
                                title="Edit Product"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-8" id="orders-dashboard-view">
            <h3 className="font-bold text-lg text-emerald-950 font-sans tracking-tight">
              Order Dispatch Management
            </h3>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
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
          </div>
        )}

        {/* 4. GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div className="space-y-8" id="gallery-dashboard-view">
            <h3 className="font-bold text-lg text-emerald-950 font-sans tracking-tight">
              Gallery Control Center
            </h3>

            {/* Gallery Upload Form */}
            <div className="bg-emerald-50/40 p-6 rounded-3xl border border-emerald-100/40 space-y-4">
              <h4 className="font-bold text-xs text-emerald-900 uppercase tracking-wider">
                Upload New Image Asset to Gallery
              </h4>
              <form onSubmit={handleAddGalleryItem} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-6">
                  <ImageUploader
                    token={token}
                    currentImageUrl={galImage}
                    category="gallery"
                    label="Select or Drag Image File"
                    onUploadSuccess={({ imageUrl, publicId }) => {
                      setGalImage(imageUrl);
                      setGalPublicId(publicId);
                    }}
                    onRemove={() => {
                      setGalImage('');
                      setGalPublicId('');
                    }}
                  />
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">or Direct URL:</span>
                    <input
                      type="text" value={galImage} onChange={e => setGalImage(e.target.value)}
                      className="flex-1 bg-white rounded-lg border border-gray-200 px-2 py-1 text-[11px]"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Gallery Category</label>
                  <select
                    value={galCategory} onChange={e => setGalCategory(e.target.value as any)}
                    className="w-full bg-white rounded-xl border border-gray-200 p-2.5 text-xs font-medium"
                  >
                    <option value="Products">Products</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Production Process">Production Process</option>
                    <option value="Company Events">Company Events</option>
                    <option value="Customers">Customers</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={!galImage}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-sm"
                  >
                    Save to Gallery
                  </button>
                </div>
              </form>
            </div>

            {/* Grid of gallery assets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {gallery.map((item) => (
                <div key={item.id} className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 group shadow-sm">
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
                <div className="py-16 text-center bg-white rounded-3xl border border-gray-100">
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
