import { variantLabel } from '../variantLabel';
import CategoryManagement from '../components/admin/CategoryManagement';
import type { Category } from '../types';
import OrderDetails from '../components/admin/OrderDetails';
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
  onLogout: () => void;
}

interface VariantFormState {
  id?: string;
  name: string;
  size: string;
  price: number | '';
  compareAtPrice: number | '';
  available: boolean;
  sku: string;
}

interface ImageFormState {
  storagePublicId?: string;
  id?: string;
  imageUrl: string;
  altText: string;
  position: number;
}

export default function AdminDashboard({ token, onLoginSuccess, userRole, onLogout }: AdminDashboardProps) {
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Nav State
  const [activeTab, setActiveTab] = useState<'categories' | 'overview' | 'images' | 'products' | 'orders' | 'gallery' | 'messages'>('overview');

  // Database States
  const [stats, setStats] = useState<any>({
    visitors: 0,
    pageViews: {},
    popularProducts: {},
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error(data.error || 'Unable to load categories.');
      setCategories(data); setCategoryError('');
    } catch (error) { setCategoryError(error instanceof Error ? error.message : 'Unable to load categories.'); }
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderError, setOrderError] = useState('');
  const [orderDetailsId, setOrderDetailsId] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Product Modals / Forms State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [publicationStatus, setPublicationStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [productPreview, setProductPreview] = useState<Product | null>(null);
  const [productFeedback, setProductFeedback] = useState('');
  
  // Product Form Fields
  const [prodName, setProdName] = useState('');
  const [prodSlug, setProdSlug] = useState('');
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodFeaturedImage, setProdFeaturedImage] = useState('');
  const [prodFeaturedPublicId, setProdFeaturedPublicId] = useState('');
  const [prodAvailable, setProdAvailable] = useState(true);
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodIngredients, setProdIngredients] = useState('');
  const [prodNutrients, setProdNutrients] = useState('');
  const [prodNutritionBasis, setProdNutritionBasis] = useState('');
  const [prodHowToUse, setProdHowToUse] = useState('');
  const [prodBenefits, setProdBenefits] = useState('');
  const [prodImages, setProdImages] = useState<ImageFormState[]>([]);
  const [prodVariants, setProdVariants] = useState<VariantFormState[]>([
    { name: '', size: '', price: '', compareAtPrice: '', available: true, sku: '' }
  ]);

  const formSignature = JSON.stringify([publicationStatus,prodName,prodSlug,prodShortDesc,prodDesc,prodCategory,prodFeaturedImage,prodFeaturedPublicId,prodAvailable,prodIsFeatured,prodIngredients,prodBenefits,prodNutrients,prodNutritionBasis,prodHowToUse,prodImages,prodVariants]);
  const [initialForm, setInitialForm] = useState('');
  useEffect(() => { if (isAddingProduct || editingProduct) setInitialForm(formSignature); }, [isAddingProduct, editingProduct?.id]);
  const formDirty = (isAddingProduct || !!editingProduct) && initialForm !== formSignature;
  useEffect(() => { const warn = (e: BeforeUnloadEvent) => { if (formDirty) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [formDirty]);
  const closeProductForm = () => { if (formDirty && !window.confirm('Discard unsaved product changes? Uploaded assets will be retained.')) return; setIsAddingProduct(false); setEditingProduct(null); };

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

      await fetchCategories();

      // Products
      const prodRes = await fetch('/api/admin/products', { headers });
      const prodData = await prodRes.json();
      if (!prodData.error) setProducts(prodData);

      // Orders
      const ordRes = await fetch('/api/orders', { headers });
      const ordData = await ordRes.json();
      if (ordRes.ok && Array.isArray(ordData)) { setOrders(ordData); setOrderError(''); }
      else setOrderError(ordData.error || 'Unable to load orders.');

      // Gallery
      const galRes = await fetch('/api/admin/gallery', { headers });
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
    setProdCategory('');
    setProdFeaturedImage('');
    setProdFeaturedPublicId('');
    setProdAvailable(true);
    setProdIsFeatured(false);
    setPublicationStatus('DRAFT');
    setProdIngredients('');
    setProdBenefits('');
    setProdNutrients(''); setProdNutritionBasis(''); setProdHowToUse('');
    setProdImages([]);
    setProdVariants([
      { name: '', size: '', price: '', compareAtPrice: '', available: true, sku: '' }
    ]);
  };

  const handleEditProductClick = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSlug(p.slug || '');
    setProdShortDesc(p.shortDescription || '');
    setProdDesc(p.description);
    setProdCategory(p.categoryId);
    setProdFeaturedImage(p.featuredImageUrl || p.image || '');
    setProdFeaturedPublicId(p.featuredImagePublicId || '');
    setProdAvailable(p.available !== false);
    setProdIsFeatured(Boolean(p.isFeatured));
    setPublicationStatus(p.publicationStatus || 'PUBLISHED');
    setProdIngredients(p.ingredients || '');
    setProdBenefits(p.benefits || '');
    setProdNutrients(p.nutrients || ''); setProdNutritionBasis(p.nutritionBasis || ''); setProdHowToUse(p.howToUse || '');

    // Set images
    if (p.images && p.images.length > 0) {
      setProdImages(p.images.map((img, idx) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        storagePublicId: img.storagePublicId,
        altText: img.altText || '',
        position: img.position ?? idx
      })));
    } else {
      setProdImages([]);
    }

    // Set variants
    if (p.variants && p.variants.length > 0) {
      setProdVariants(p.variants.map(v => ({
        id: v.id,
        name: v.name,
        size: v.size,
        price: typeof v.price === 'number' && Number.isFinite(v.price) ? v.price : '',
        compareAtPrice: v.compareAtPrice ?? '',
        available: v.available,
        sku: v.sku || ''
      })));
    } else {
      setProdVariants([{ name: '', size: '', price: '', compareAtPrice: '', available: true, sku: '' }]);
    }
  };

  // Add Variant Row
  const handleAddVariantRow = () => {
    setProdVariants([
      ...prodVariants,
      { name: '', size: '', price: '', compareAtPrice: '', available: true, sku: '' }
    ]);
  };

  // Remove Variant Row
  const handleRemoveVariantRow = (index: number) => {
    if (prodVariants.length <= 1) return;
    setProdVariants(prodVariants.flatMap((v, i) => i !== index ? [v] : v.id ? [{ ...v, available: false }] : []));
  };

  // Update Variant Row
  const handleUpdateVariantField = (index: number, field: keyof VariantFormState, value: any) => {
    setProdVariants(current => current.map((v, i) => i === index ? { ...v, [field]: value } : v));
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
    updated[index] = { ...updated[index], [field]: value, ...(field === 'imageUrl' ? { storagePublicId: '' } : {}) };
    setProdImages(updated);
  };

  // Submit Product Form (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodDesc || prodVariants.length === 0) return;

    setProductFeedback('');
    setIsSavingProduct(true);
    try {
      const payload = {
        name: prodName,
        slug: prodSlug || undefined,
        shortDescription: prodShortDesc,
        description: prodDesc,
        categoryId: prodCategory,
        featuredImageUrl: prodFeaturedImage || (prodImages[0]?.imageUrl || ''),
        featuredImagePublicId: prodFeaturedPublicId || '',
        available: prodAvailable,
        isFeatured: prodIsFeatured,
        publicationStatus,
        ingredients: prodIngredients,
        benefits: prodBenefits,
        nutrients: prodNutrients, nutritionBasis: prodNutritionBasis, howToUse: prodHowToUse,
        images: prodImages.filter(img => img.imageUrl.trim() !== ''),
        variants: prodVariants.map(v => {
          if (v.price === '') throw new Error('Enter an explicit price for every variant.');
          return ({
          id: v.id,
          name: v.name.trim(),
          size: v.size.trim(),
          price: v.price,
          compareAtPrice: v.compareAtPrice === '' ? null : Number(v.compareAtPrice),
          available: v.available,
          sku: v.sku || ''
        }); })
      };

      const imageFields = (rows: ProductImage[]) => rows.map(i => ({ id:i.id, imageUrl:i.imageUrl, storagePublicId:i.storagePublicId || '', altText:i.altText || '', position:i.position }));
      const variantFields = (rows: ProductVariant[]) => rows.map(v => ({ id:v.id, name:v.name.trim(),size:v.size.trim(),price:v.price,compareAtPrice:v.compareAtPrice ?? null,available:v.available,sku:v.sku || '' }));
      const submitted: Record<string, unknown> = { ...payload };
      if (editingProduct) {
        for (const key of Object.keys(submitted)) {
          const old = key === 'images' ? imageFields(editingProduct.images) : key === 'variants' ? variantFields(editingProduct.variants) : (editingProduct as any)[key];
          const value = key === 'images' ? imageFields(payload.images as ProductImage[]) : submitted[key];
          if (JSON.stringify(value) === JSON.stringify(old)) delete submitted[key];
        }
      }

      if (editingProduct && submitted.images !== undefined) submitted.removedImageIds = editingProduct.images.filter(i => !payload.images.some(row => row.id === i.id)).map(i => i.id);

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submitted)
      });

      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Product save failed'); }
      if (res.ok) {
        setIsAddingProduct(false);
        setEditingProduct(null);
        resetProductForm();
        window.dispatchEvent(new Event('nita-products-changed'));
        setProductFeedback('Product saved.');
        fetchAdminData();
      }
    } catch (err) {
      setProductFeedback(err instanceof Error ? err.message : 'Product save failed');
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
                Admin login
              </h2>
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
              <label htmlFor="admin-email" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Enter your email address"
                />
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
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
              Dashboard
            </h1>
            <p className="text-xs text-gray-500">
              Role: <span className="font-bold text-emerald-700">{userRole}</span>
            </p>
          </div>

          <button type="button" onClick={onLogout} className="text-sm font-semibold text-emerald-800 underline underline-offset-4">Sign out</button>

          {/* Quick Tab Select */}
          <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-2xl border border-gray-200/50">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'images', label: 'Images', icon: Sparkles },
              { id: 'categories', label: 'Categories', icon: Layers },
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
                  <span>Product views</span>
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
                  <span>Page views</span>
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
        {activeTab === 'categories' && <CategoryManagement token={token} categories={categories} loadError={categoryError} onChange={async () => { await fetchCategories(); await fetchAdminData(); }} />}

        {activeTab === 'products' && (
          <div className="space-y-8" id="products-dashboard-view">
            {productFeedback && <p role="status">{productFeedback}</p>}
            {productPreview && <section aria-label="Private saved product preview" className="border p-4 my-4"><button type="button" onClick={() => setProductPreview(null)}>Close preview</button><p>Private preview - {productPreview.publicationStatus}</p><h2>{productPreview.name}</h2><p>{productPreview.description}</p>{productPreview.featuredImageUrl && <img src={productPreview.featuredImageUrl} alt={productPreview.name} className="max-h-64 object-contain" />}{productPreview.variants.map(v => <p key={v.id}>{v.name || v.size}: {formatTZS(v.price)} - {v.available ? 'Active' : 'Inactive'}</p>)}</section>}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-emerald-950 font-sans tracking-tight">
                  Products
                </h3>
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
                <span>Add product</span>
              </button>
            </div>

            {/* Product Add or Edit Modal Overlays */}
            {(isAddingProduct || editingProduct) && (
              <div className="min-w-0 bg-white p-6 sm:p-8 rounded-3xl border border-emerald-200 shadow-lg text-xs space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <div>
                    <h4 className="font-extrabold text-base text-emerald-950">
                      {editingProduct ? `Edit Product: ${editingProduct.name}` : 'New product'}
                    </h4>
                  </div>
                  <button
                    onClick={closeProductForm}
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
                          required value={prodCategory} onChange={e => setProdCategory(e.target.value)}
                          className="w-full bg-gray-50/50 rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-emerald-500"
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => <option key={category.id} value={category.id}>{category.name || 'Unnamed legacy category'}</option>)}
                        </select>
                        {categoryError && <p role="alert">{categoryError}</p>}
                        {!categories.length && <p>Create a category in Categories first.</p>}
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
                          label="Featured image"
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
                            type="text" value={prodFeaturedImage} onChange={e => { setProdFeaturedImage(e.target.value); setProdFeaturedPublicId(''); }}
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
                          placeholder="Product description"
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
                        <label className="block font-bold text-gray-700 mb-1">Approved product benefits</label>
                        <textarea 
                          rows={2} value={prodBenefits} onChange={e => setProdBenefits(e.target.value)}
                          className="w-full bg-gray-50/50 rounded-xl border border-gray-200 px-3.5 py-2 text-xs"
                          placeholder="Approved product benefits only"
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
                          <span className="font-bold text-gray-800">Product Enable ordering</span>
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

                  <label className="block my-4">Publication status<select value={publicationStatus} onChange={e => setPublicationStatus(e.target.value as typeof publicationStatus)} className="block w-full min-w-0 max-w-full border p-2"><option value="DRAFT">Draft - private</option><option value="PUBLISHED">Published - public</option><option value="ARCHIVED">Archived - private, not purchasable</option></select></label>
                  <fieldset className="space-y-3"><legend className="font-bold">Approved product information (optional)</legend><p>Use approved label text. Leave unknown details blank; include the nutrition basis and units.</p>
                    <label className="block" htmlFor="product-nutrients">Nutrients Available</label><textarea id="product-nutrients" maxLength={10000} rows={3} className="w-full border p-2" value={prodNutrients} onChange={e => setProdNutrients(e.target.value)} />
                    <label className="block" htmlFor="product-nutrition-basis">Nutrition basis and units</label><input id="product-nutrition-basis" maxLength={200} className="w-full border p-2" value={prodNutritionBasis} onChange={e => setProdNutritionBasis(e.target.value)} aria-describedby="nutrition-basis-help" /><p id="nutrition-basis-help">State the basis and units exactly as supplied on the approved label.</p>
                    <label className="block" htmlFor="product-how-to-use">How to Use</label><textarea id="product-how-to-use" maxLength={10000} rows={3} className="w-full border p-2" value={prodHowToUse} onChange={e => setProdHowToUse(e.target.value)} />
                  </fieldset>
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
                      <p className="text-[11px] text-gray-400 italic">No gallery images. The featured image will be used.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {prodImages.map((img, idx) => (
                          <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200/60">
                            <span className="text-[10px] font-bold text-gray-400 w-5">#{idx + 1}</span>
                            <input
                              type="text"
                              value={img.imageUrl}
                              onChange={(e) => handleUpdateImageField(idx, 'imageUrl', e.target.value)}
                              placeholder="Image URL..."
                              className="min-w-0 flex-1 bg-white rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
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
                          3. Product Variants (Sizes & Pricing)
                        </h5>
                        <p className="text-[10px] text-gray-500">Order requests are reviewed and confirmed manually.</p>
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
                        <div key={idx} className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100 grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">Pack Size</label>
                            <input
                              type="text"
                              value={v.size}
                              onChange={(e) => {
                                handleUpdateVariantField(idx, 'size', e.target.value);

                              }}
                              placeholder="e.g. 250g Pouch"
                              className="w-full bg-white rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
                            />
                          </div>

                          <div><label className="block text-[10px] font-bold text-gray-600 mb-1">Variant Name (optional)</label><input value={v.name} onChange={e => handleUpdateVariantField(idx, 'name', e.target.value)} className="w-full bg-white rounded-lg border px-2 py-1 text-xs" /></div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">Price (TZS) *</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={v.price}
                              onChange={(e) => handleUpdateVariantField(idx, 'price', e.target.value === '' ? '' : Number(e.target.value))}
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
                              <span className="font-semibold text-gray-700">{v.available ? 'Active' : 'Inactive / archived'}</span>
                            </label>
                            
                            <button
                              type="button"
                              disabled={prodVariants.length <= 1}
                              onClick={() => handleRemoveVariantRow(idx)}
                              className="p-1.5 text-red-500 hover:text-red-700 disabled:opacity-30"
                              title="Saved variants are kept inactive to preserve order references"
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
                      type="button" onClick={closeProductForm}
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
                            <p className="font-bold text-gray-900 text-sm">{p.name}</p><span className="block text-xs">{p.publicationStatus || 'PUBLISHED'}</span>{(!p.publicationStatus || p.publicationStatus === 'PUBLISHED') && <a href={`/products/${p.slug || p.id}`} target="_blank" rel="noopener noreferrer" className="underline">View public product</a>} <button type="button" className="underline" onClick={async () => { try { const r=await fetch('/api/admin/products/'+p.id+'/preview',{headers:{Authorization:'Bearer '+token},cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error(data.error);setProductPreview(data); } catch(e){setProductFeedback((e as Error).message)} }}>Preview saved product</button>
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
                                    {variantLabel(v)}: {formatTZS(v.price)}
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

        {orderDetailsId && token && <OrderDetails id={orderDetailsId} token={token} onClose={() => setOrderDetailsId(null)} />}
        {/* 3. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-8" id="orders-dashboard-view">
            {orderError && <p role="alert" className="text-red-700">{orderError}</p>}
            <h3 className="font-bold text-lg text-emerald-950 font-sans tracking-tight">
              Orders
            </h3>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
                      <th className="p-4 text-left">Order Ref</th>
                      <th className="p-4 text-left">Customer</th>
                      <th className="p-4 text-left">Phone</th>
                      <th className="p-4 text-left">Date</th>
                      <th className="p-4 text-left">Items</th>
                      <th className="p-4 text-left">Total</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-mono font-bold text-emerald-800"><button onClick={() => setOrderDetailsId(o.id)} className="underline break-all">{o.orderNumber || o.id}</button></td>
                        <td className="p-4 font-bold text-gray-900">{o.customerName}</td>
                        <td className="p-4 text-gray-600 font-medium flex items-center space-x-1">
                          <Smartphone className="w-3 h-3 text-gray-400" />
                          <span>{o.phone}</span>
                        </td>
                        <td className="p-4 text-gray-600 font-semibold">{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-gray-500">{o.items?.length || 1}</td>
                        <td className="p-4 text-gray-900 font-bold">{o.total == null ? 'Unknown (legacy)' : formatTZS(Number(o.total))}</td>
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
              Gallery
            </h3>

            {/* Gallery Upload Form */}
            <div className="bg-emerald-50/40 p-6 rounded-3xl border border-emerald-100/40 space-y-4">
              <h4 className="font-bold text-xs text-emerald-900 uppercase tracking-wider">
                Add gallery image
              </h4>
              <form onSubmit={handleAddGalleryItem} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-6">
                  <ImageUploader
                    token={token}
                    currentImageUrl={galImage}
                    category="gallery"
                    label="Gallery image"
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
              Messages
            </h3>

            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-3xl border border-gray-100">
                  <p className="text-gray-400 text-xs">No messages yet.</p>
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
