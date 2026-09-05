import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Edit3, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Eye, 
  Layers, 
  Factory, 
  ShieldCheck, 
  Package, 
  ExternalLink,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Check
} from 'lucide-react';
import ImageUploader from '../ImageUploader';
import { Product, GalleryItem } from '../../types';

interface SiteImage {
  id: string;
  section: 'PRODUCTION' | 'FACTORY' | 'QUALITY_CERTIFICATIONS';
  imageUrl: string;
  storagePublicId?: string;
  altText?: string;
  title?: string;
  position: number;
  enabled: boolean;
  createdAt: string;
}

interface ImageManagementSectionProps {
  token: string | null;
  products: Product[];
  gallery: GalleryItem[];
  onRefreshData: () => void;
}

type ImageGroup = 'products' | 'gallery' | 'production' | 'factory' | 'quality';

export default function ImageManagementSection({
  token,
  products,
  gallery,
  onRefreshData,
}: ImageManagementSectionProps) {
  const [activeGroup, setActiveGroup] = useState<ImageGroup>('production');
  const [siteImages, setSiteImages] = useState<SiteImage[]>([]);
  const [loadingSiteImages, setLoadingSiteImages] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<{
    configured: boolean;
    provider: string;
    cloudName: string | null;
  } | null>(null);

  // New/Edit Site Image Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SiteImage | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalAltText, setModalAltText] = useState('');
  const [modalPosition, setModalPosition] = useState<number>(0);
  const [modalEnabled, setModalEnabled] = useState(true);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalPublicId, setModalPublicId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gallery Add/Edit Modal
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [galCategory, setGalCategory] = useState<'Products' | 'Packaging' | 'Production Process' | 'Company Events' | 'Customers'>('Production Process');
  const [galTitle, setGalTitle] = useState('');
  const [galDescription, setGalDescription] = useState('');
  const [galImageUrl, setGalImageUrl] = useState('');
  const [galPublicId, setGalPublicId] = useState('');

  // Product Image Modal
  const [productImageModalOpen, setProductImageModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [prodAltText, setProdAltText] = useState('');
  const [prodUploadedUrl, setProdUploadedUrl] = useState('');
  const [prodUploadedPublicId, setProdUploadedPublicId] = useState('');
  const [isPrimaryFeatured, setIsPrimaryFeatured] = useState(false);

  useEffect(() => {
    fetchSiteImages();
    if (token) {
      fetch('/api/admin/images/status', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setStorageStatus(data))
        .catch((err) => console.error('Error fetching storage status:', err));
    }
  }, [token]);

  const fetchSiteImages = async () => {
    setLoadingSiteImages(true);
    try {
      const res = await fetch('/api/site-images');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSiteImages(data);
      }
    } catch (err) {
      console.error('Failed to load site images:', err);
    } finally {
      setLoadingSiteImages(false);
    }
  };

  const notifySuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const notifyError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 5000);
  };

  // Filter site images for the active group
  const currentSectionCode = 
    activeGroup === 'production' ? 'PRODUCTION' :
    activeGroup === 'factory' ? 'FACTORY' :
    activeGroup === 'quality' ? 'QUALITY_CERTIFICATIONS' : null;

  const currentSectionImages = currentSectionCode
    ? siteImages.filter((img) => img.section === currentSectionCode)
    : [];

  // Handle open site image create modal
  const handleOpenCreateSiteImage = () => {
    setEditingItem(null);
    setModalTitle('');
    setModalAltText('');
    setModalPosition(currentSectionImages.length);
    setModalEnabled(true);
    setModalImageUrl('');
    setModalPublicId('');
    setModalOpen(true);
  };

  // Handle open site image edit modal
  const handleOpenEditSiteImage = (item: SiteImage) => {
    setEditingItem(item);
    setModalTitle(item.title || '');
    setModalAltText(item.altText || '');
    setModalPosition(item.position || 0);
    setModalEnabled(item.enabled);
    setModalImageUrl(item.imageUrl);
    setModalPublicId(item.storagePublicId || '');
    setModalOpen(true);
  };

  // Save Site Image (Create or Update)
  const handleSaveSiteImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalImageUrl) {
      notifyError('Please upload an image before saving.');
      return;
    }

    if (!currentSectionCode) return;

    setIsSubmitting(true);
    try {
      const url = editingItem
        ? `/api/admin/site-images/${editingItem.id}`
        : '/api/admin/site-images';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          section: currentSectionCode,
          imageUrl: modalImageUrl,
          storagePublicId: modalPublicId,
          title: modalTitle,
          altText: modalAltText,
          position: modalPosition,
          enabled: modalEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save image.');

      notifySuccess(editingItem ? 'Image updated successfully.' : 'Image added successfully.');
      setModalOpen(false);
      fetchSiteImages();
    } catch (err: any) {
      notifyError(err.message || 'Error saving image.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Site Image
  const handleDeleteSiteImage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this image? It will be removed from storage and database.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/site-images/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete image.');

      notifySuccess('Image deleted successfully.');
      fetchSiteImages();
    } catch (err: any) {
      notifyError(err.message || 'Failed to delete image.');
    }
  };

  // Toggle Site Image enabled status
  const handleToggleEnabled = async (item: SiteImage) => {
    try {
      const res = await fetch(`/api/admin/site-images/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !item.enabled }),
      });
      if (res.ok) {
        fetchSiteImages();
      }
    } catch (err) {
      console.error('Error toggling image status:', err);
    }
  };

  // Reorder Site Images
  const handleMoveSiteImage = async (item: SiteImage, direction: -1 | 1) => {
    const list = [...currentSectionImages].sort((a, b) => a.position - b.position);
    const currIdx = list.findIndex((i) => i.id === item.id);
    const targetIdx = currIdx + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const targetItem = list[targetIdx];
    const updatedItems = list.map((i, idx) => {
      if (idx === currIdx) return { id: i.id, position: targetItem.position };
      if (idx === targetIdx) return { id: i.id, position: item.position };
      return { id: i.id, position: i.position };
    });

    try {
      const res = await fetch('/api/admin/site-images/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: updatedItems }),
      });
      if (!res.ok) throw new Error('Failed to update image positions.');
      notifySuccess('Order updated successfully.');
      fetchSiteImages();
    } catch (err: any) {
      notifyError(err.message || 'Failed to update order.');
    }
  };

  // Gallery: Open Edit
  const handleOpenEditGallery = (item: GalleryItem) => {
    setEditingGalleryItem(item);
    setGalTitle(item.title || '');
    setGalDescription(item.description || '');
    setGalCategory((item.category as any) || 'Production Process');
    setGalImageUrl(item.image || item.imageUrl || '');
    setGalPublicId(item.storagePublicId || '');
    setGalleryModalOpen(true);
  };

  // Gallery: Reorder
  const handleMoveGalleryItem = async (item: GalleryItem, direction: -1 | 1) => {
    const list = [...gallery];
    const currIdx = list.findIndex((i) => i.id === item.id);
    const targetIdx = currIdx + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[currIdx];
    list[currIdx] = list[targetIdx];
    list[targetIdx] = temp;

    const updatedItems = list.map((i, idx) => ({
      id: i.id,
      position: idx,
    }));

    try {
      const res = await fetch('/api/admin/gallery/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: updatedItems }),
      });
      if (!res.ok) throw new Error('Failed to update gallery order.');
      notifySuccess('Gallery order updated.');
      onRefreshData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to update gallery order.');
    }
  };

  // Save Gallery Item (Create or Edit)
  const handleSaveGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galImageUrl) {
      notifyError('Please upload an image before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingGalleryItem
        ? `/api/admin/gallery/${editingGalleryItem.id}`
        : '/api/admin/gallery';
      const method = editingGalleryItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: galTitle || galCategory,
          description: galDescription,
          category: galCategory,
          image: galImageUrl,
          imageUrl: galImageUrl,
          storagePublicId: galPublicId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save gallery item.');

      notifySuccess(editingGalleryItem ? 'Gallery item updated successfully.' : 'Gallery photo uploaded and saved successfully.');
      setGalleryModalOpen(false);
      setEditingGalleryItem(null);
      setGalTitle('');
      setGalDescription('');
      setGalImageUrl('');
      setGalPublicId('');
      onRefreshData();
    } catch (err: any) {
      notifyError(err.message || 'Error saving gallery photo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Gallery Item
  const handleDeleteGalleryItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this gallery item? It will be removed from Cloudinary and the database.')) return;
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete gallery item.');

      notifySuccess('Gallery item deleted successfully.');
      onRefreshData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to delete gallery item.');
    }
  };

  // Product: Remove Primary Featured Image
  const handleRemoveProductFeaturedImage = async (prod: Product) => {
    if (!window.confirm(`Remove primary featured image for "${prod.name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${prod.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...prod,
          featuredImageUrl: '',
          featuredImagePublicId: '',
        }),
      });
      if (!res.ok) throw new Error('Failed to remove featured image.');
      notifySuccess('Featured image removed.');
      onRefreshData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to remove featured image.');
    }
  };

  // Product: Delete Additional Angle Image
  const handleDeleteProductImage = async (prod: Product, imageId?: string, imageUrl?: string, storagePublicId?: string) => {
    if (!window.confirm('Delete this product additional image? It will be removed from Cloudinary and the database.')) return;
    try {
      if (imageId) {
        const res = await fetch(`/api/admin/products/${prod.id}/images/${imageId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to delete image.');
      } else {
        const updatedImages = (prod.images || []).filter((img) => img.imageUrl !== imageUrl);
        const res = await fetch(`/api/products/${prod.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...prod,
            images: updatedImages,
          }),
        });
        if (!res.ok) throw new Error('Failed to delete image.');
      }
      notifySuccess('Product angle deleted.');
      onRefreshData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to delete product image.');
    }
  };

  // Product: Reorder Additional Angles
  const handleMoveProductImage = async (prod: Product, index: number, direction: -1 | 1) => {
    const list = [...(prod.images || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reordered = list.map((item, idx) => ({
      ...item,
      position: idx,
    }));

    try {
      const res = await fetch(`/api/admin/products/${prod.id}/images/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: reordered }),
      });
      if (!res.ok) {
        // Fallback to updating product
        await fetch(`/api/products/${prod.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...prod, images: reordered }),
        });
      }
      notifySuccess('Product angle order updated.');
      onRefreshData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to reorder images.');
    }
  };

  // Add Image to Product (Featured or Additional Angle)
  const handleSaveProductImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!prodUploadedUrl) {
      notifyError('Please upload an image first.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isPrimaryFeatured) {
        const res = await fetch(`/api/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...selectedProduct,
            featuredImageUrl: prodUploadedUrl,
            featuredImagePublicId: prodUploadedPublicId,
          }),
        });
        if (!res.ok) throw new Error('Failed to update product featured image.');
      } else {
        const currentImages = selectedProduct.images || [];
        const res = await fetch(`/api/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...selectedProduct,
            images: [
              ...currentImages.map((img) => ({
                id: img.id,
                imageUrl: img.imageUrl,
                storagePublicId: img.storagePublicId,
                altText: img.altText,
                position: img.position,
              })),
              {
                imageUrl: prodUploadedUrl,
                storagePublicId: prodUploadedPublicId,
                altText: prodAltText || selectedProduct.name,
                position: currentImages.length,
              },
            ],
          }),
        });
        if (!res.ok) throw new Error('Failed to add product image.');
      }

      notifySuccess('Product image saved successfully.');
      setProductImageModalOpen(false);
      setProdUploadedUrl('');
      setProdUploadedPublicId('');
      setProdAltText('');
      onRefreshData();
    } catch (err: any) {
      notifyError(err.message || 'Failed to update product image.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8" id="image-management-system">
      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-medium shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3 text-sm font-medium shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Header & Description */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>PostgreSQL & Cloudinary Storage</span>
            </div>
            {storageStatus?.configured ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Cloud className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cloudinary Connected ({storageStatus.cloudName || 'Active'})</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Local Storage Fallback</span>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-emerald-950 font-sans tracking-tight">
            Image Management System
          </h2>
          <p className="text-xs text-gray-500 max-w-2xl">
            Upload, optimize, and manage imagery for all 5 core website image groups. Uploads are stored securely in external image storage and synchronized with PostgreSQL via Prisma.
          </p>
        </div>

        {/* Global Action Button per Group */}
        <div>
          {activeGroup === 'gallery' ? (
            <button
              onClick={() => {
                setEditingGalleryItem(null);
                setGalImageUrl('');
                setGalPublicId('');
                setGalTitle('');
                setGalDescription('');
                setGalleryModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-2xl shadow-sm transition"
              id="admin-add-gallery-image-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Gallery Image</span>
            </button>
          ) : (activeGroup === 'production' || activeGroup === 'factory' || activeGroup === 'quality') ? (
            <button
              onClick={handleOpenCreateSiteImage}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-2xl shadow-sm transition"
              id="admin-add-site-image-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add {activeGroup === 'production' ? 'Production' : activeGroup === 'factory' ? 'Factory' : 'Certification'} Image</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* 5 Image Groups Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Product Images */}
        <button
          onClick={() => setActiveGroup('products')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between space-y-2 ${
            activeGroup === 'products'
              ? 'bg-emerald-900 text-white border-emerald-900 shadow-md shadow-emerald-950/10'
              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <Package className={`w-5 h-5 ${activeGroup === 'products' ? 'text-orange-400' : 'text-emerald-700'}`} />
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              activeGroup === 'products' ? 'bg-emerald-800 text-emerald-200' : 'bg-gray-100 text-gray-600'
            }`}>
              {products.length}
            </span>
          </div>
          <div>
            <p className="text-xs font-extrabold font-sans">1. Product Images</p>
            <p className={`text-[10px] ${activeGroup === 'products' ? 'text-emerald-200/70' : 'text-gray-400'}`}>
              Featured & gallery photos
            </p>
          </div>
        </button>

        {/* 2. Gallery Images */}
        <button
          onClick={() => setActiveGroup('gallery')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between space-y-2 ${
            activeGroup === 'gallery'
              ? 'bg-emerald-900 text-white border-emerald-900 shadow-md shadow-emerald-950/10'
              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <ImageIcon className={`w-5 h-5 ${activeGroup === 'gallery' ? 'text-orange-400' : 'text-emerald-700'}`} />
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              activeGroup === 'gallery' ? 'bg-emerald-800 text-emerald-200' : 'bg-gray-100 text-gray-600'
            }`}>
              {gallery.length}
            </span>
          </div>
          <div>
            <p className="text-xs font-extrabold font-sans">2. Gallery Images</p>
            <p className={`text-[10px] ${activeGroup === 'gallery' ? 'text-emerald-200/70' : 'text-gray-400'}`}>
              Events, customers, packaging
            </p>
          </div>
        </button>

        {/* 3. Production Section Images */}
        <button
          onClick={() => setActiveGroup('production')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between space-y-2 ${
            activeGroup === 'production'
              ? 'bg-emerald-900 text-white border-emerald-900 shadow-md shadow-emerald-950/10'
              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <Layers className={`w-5 h-5 ${activeGroup === 'production' ? 'text-orange-400' : 'text-emerald-700'}`} />
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              activeGroup === 'production' ? 'bg-emerald-800 text-emerald-200' : 'bg-gray-100 text-gray-600'
            }`}>
              {siteImages.filter((i) => i.section === 'PRODUCTION').length}
            </span>
          </div>
          <div>
            <p className="text-xs font-extrabold font-sans">3. Production Section</p>
            <p className={`text-[10px] ${activeGroup === 'production' ? 'text-emerald-200/70' : 'text-gray-400'}`}>
              Hulling, sorting & roasting
            </p>
          </div>
        </button>

        {/* 4. Factory Section Image */}
        <button
          onClick={() => setActiveGroup('factory')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between space-y-2 ${
            activeGroup === 'factory'
              ? 'bg-emerald-900 text-white border-emerald-900 shadow-md shadow-emerald-950/10'
              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <Factory className={`w-5 h-5 ${activeGroup === 'factory' ? 'text-orange-400' : 'text-emerald-700'}`} />
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              activeGroup === 'factory' ? 'bg-emerald-800 text-emerald-200' : 'bg-gray-100 text-gray-600'
            }`}>
              {siteImages.filter((i) => i.section === 'FACTORY').length}
            </span>
          </div>
          <div>
            <p className="text-xs font-extrabold font-sans">4. Factory Section</p>
            <p className={`text-[10px] ${activeGroup === 'factory' ? 'text-emerald-200/70' : 'text-gray-400'}`}>
              Industrial plant & machinery
            </p>
          </div>
        </button>

        {/* 5. Quality / Certifications Section Images */}
        <button
          onClick={() => setActiveGroup('quality')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between space-y-2 ${
            activeGroup === 'quality'
              ? 'bg-emerald-900 text-white border-emerald-900 shadow-md shadow-emerald-950/10'
              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <ShieldCheck className={`w-5 h-5 ${activeGroup === 'quality' ? 'text-orange-400' : 'text-emerald-700'}`} />
            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              activeGroup === 'quality' ? 'bg-emerald-800 text-emerald-200' : 'bg-gray-100 text-gray-600'
            }`}>
              {siteImages.filter((i) => i.section === 'QUALITY_CERTIFICATIONS').length}
            </span>
          </div>
          <div>
            <p className="text-xs font-extrabold font-sans">5. Quality & Certs</p>
            <p className={`text-[10px] ${activeGroup === 'quality' ? 'text-emerald-200/70' : 'text-gray-400'}`}>
              TBS, lab & organic seals
            </p>
          </div>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. PRODUCT IMAGES VIEW */}
      {/* ======================================================== */}
      {activeGroup === 'products' && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 space-y-6 text-left shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-emerald-950 font-sans">
                Product Image Catalog
              </h3>
              <p className="text-xs text-gray-500">
                Manage featured images and secondary gallery shots for each manufactured food product.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-gray-50/70 rounded-2xl border border-gray-200/70 p-5 space-y-4 hover:border-emerald-200 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {prod.category}
                    </span>
                    <h4 className="font-extrabold text-sm text-gray-900 mt-1 font-sans">
                      {prod.name}
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProduct(prod);
                      setIsPrimaryFeatured(false);
                      setProdUploadedUrl('');
                      setProdUploadedPublicId('');
                      setProdAltText('');
                      setProductImageModalOpen(true);
                    }}
                    className="p-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition"
                    title="Upload image for this product"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>

                {/* Main Featured Image */}
                <div className="relative h-44 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                  {prod.featuredImageUrl ? (
                    <img
                      src={prod.featuredImageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-4 text-gray-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[11px]">No featured image uploaded</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-emerald-950/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                    Primary Image
                  </span>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                    {prod.featuredImageUrl && (
                      <button
                        onClick={() => handleRemoveProductFeaturedImage(prod)}
                        className="px-2.5 py-1 bg-red-600/90 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg shadow-sm backdrop-blur-xs transition"
                        title="Remove primary image"
                      >
                        Remove
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedProduct(prod);
                        setIsPrimaryFeatured(true);
                        setProdUploadedUrl(prod.featuredImageUrl || '');
                        setProdUploadedPublicId(prod.featuredImagePublicId || '');
                        setProdAltText(prod.name);
                        setProductImageModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white/90 hover:bg-white text-gray-800 text-[10px] font-bold rounded-lg shadow-sm backdrop-blur-xs transition"
                    >
                      {prod.featuredImageUrl ? 'Replace' : 'Upload'}
                    </button>
                  </div>
                </div>

                {/* Additional Images Count & Thumbnails */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Additional Angles ({prod.images?.length || 0})
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProduct(prod);
                        setIsPrimaryFeatured(false);
                        setProdUploadedUrl('');
                        setProdUploadedPublicId('');
                        setProdAltText('');
                        setProductImageModalOpen(true);
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Angle</span>
                    </button>
                  </div>

                  {prod.images && prod.images.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {prod.images.map((im, idx) => (
                        <div
                          key={im.id || idx}
                          className="relative group w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-2xs"
                        >
                          <img
                            src={im.imageUrl}
                            alt={im.altText || `Angle ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-0.5">
                            {idx > 0 && (
                              <button
                                onClick={() => handleMoveProductImage(prod, idx, -1)}
                                title="Move Left"
                                className="p-0.5 bg-white/90 hover:bg-white text-gray-800 rounded text-[9px]"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}
                            {idx < prod.images.length - 1 && (
                              <button
                                onClick={() => handleMoveProductImage(prod, idx, 1)}
                                title="Move Right"
                                className="p-0.5 bg-white/90 hover:bg-white text-gray-800 rounded text-[9px]"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteProductImage(prod, im.id, im.imageUrl, im.storagePublicId)}
                              title="Delete Photo"
                              className="p-0.5 bg-red-600 hover:bg-red-700 text-white rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">No secondary angle photos yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. GALLERY IMAGES VIEW */}
      {/* ======================================================== */}
      {activeGroup === 'gallery' && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 space-y-6 text-left shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-emerald-950 font-sans">
                Gallery Photos ({gallery.length})
              </h3>
              <p className="text-xs text-gray-500">
                Visual tour photos displayed on the public Gallery page categorized by theme.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {gallery.map((item, idx) => (
              <div
                key={item.id}
                className="bg-gray-50 rounded-2xl border border-gray-200/70 overflow-hidden flex flex-col justify-between group hover:shadow-md transition duration-200"
              >
                <div className="relative h-44 bg-gray-200 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title || item.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="bg-emerald-950/80 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                      {item.category}
                    </span>
                    <span className="bg-white/85 text-gray-800 text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                      #{idx + 1}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="font-extrabold text-xs text-gray-900 truncate font-sans">
                    {item.title || 'Untitled Photo'}
                  </h4>
                  {item.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      {idx > 0 && (
                        <button
                          onClick={() => handleMoveGalleryItem(item, -1)}
                          className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-white rounded-lg transition"
                          title="Move Left"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < gallery.length - 1 && (
                        <button
                          onClick={() => handleMoveGalleryItem(item, 1)}
                          className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-white rounded-lg transition"
                          title="Move Right"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditGallery(item)}
                        className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-white rounded-lg transition"
                        title="Edit Photo Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGalleryItem(item.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        title="Delete from Gallery"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3, 4, 5. SITE IMAGES (PRODUCTION / FACTORY / QUALITY) */}
      {/* ======================================================== */}
      {(activeGroup === 'production' || activeGroup === 'factory' || activeGroup === 'quality') && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 space-y-6 text-left shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-emerald-950 font-sans">
                {activeGroup === 'production' && 'Production Process Section Images'}
                {activeGroup === 'factory' && 'Factory Facility Section Images'}
                {activeGroup === 'quality' && 'Quality & Certifications Section Images'}
              </h3>
              <p className="text-xs text-gray-500">
                {activeGroup === 'production' && 'Photographs corresponding to the 4-step sorting, hulling, roasting, and packaging process.'}
                {activeGroup === 'factory' && 'Industrial plant and manufacturing facility visuals displayed on corporate pages.'}
                {activeGroup === 'quality' && 'TBS certifications, lab inspections, and food hygiene verification photos.'}
              </p>
            </div>
          </div>

          {loadingSiteImages ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Loading section images from database...</p>
            </div>
          ) : currentSectionImages.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-500">No images configured for this section yet.</p>
              <button
                onClick={handleOpenCreateSiteImage}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Image</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentSectionImages.map((img, idx) => (
                <div
                  key={img.id}
                  className="bg-gray-50 rounded-2xl border border-gray-200/80 overflow-hidden flex flex-col justify-between group hover:border-emerald-200 transition"
                >
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={img.imageUrl}
                      alt={img.altText || img.title || 'Section Image'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1.5">
                      <span className="bg-emerald-950/80 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                        Pos #{img.position}
                      </span>
                      {activeGroup === 'factory' && (idx === 0 || img.position === 0) && (
                        <span className="bg-emerald-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                          Primary Facility
                        </span>
                      )}
                      {!img.enabled && (
                        <span className="bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-extrabold text-xs text-gray-900 font-sans">
                        {img.title || 'Untitled Image'}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                        Alt: {img.altText || 'None'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleEnabled(img)}
                          className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                            img.enabled
                              ? 'text-emerald-700 bg-emerald-100/60 hover:bg-emerald-200'
                              : 'text-gray-500 bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          {img.enabled ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4" />}
                          <span>{img.enabled ? 'Active' : 'Disabled'}</span>
                        </button>

                        <div className="flex items-center">
                          {idx > 0 && (
                            <button
                              onClick={() => handleMoveSiteImage(img, -1)}
                              className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-white rounded transition"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {idx < currentSectionImages.length - 1 && (
                            <button
                              onClick={() => handleMoveSiteImage(img, 1)}
                              className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-white rounded transition"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditSiteImage(img)}
                          className="p-2 text-gray-600 hover:text-emerald-700 hover:bg-white rounded-lg transition"
                          title="Edit Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSiteImage(img.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT SITE IMAGE */}
      {/* ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 text-left max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-gray-900 font-sans">
                {editingItem ? 'Edit Section Image' : `Add Image to ${activeGroup.toUpperCase()}`}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSiteImage} className="space-y-4">
              {/* Image Uploader */}
              <ImageUploader
                token={token}
                currentImageUrl={modalImageUrl}
                currentPublicId={modalPublicId}
                category={activeGroup}
                label="Choose Image File"
                recommendedDimensions="Recommended: 1200x800, High Resolution"
                onUploadSuccess={({ imageUrl, publicId }) => {
                  setModalImageUrl(imageUrl);
                  setModalPublicId(publicId);
                }}
                onRemove={() => {
                  setModalImageUrl('');
                  setModalPublicId('');
                }}
              />

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Title / Step Name
                </label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Step 1: Pre-Sorting & Quality Grading"
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Alt Text (for accessibility & SEO)
                </label>
                <input
                  type="text"
                  value={modalAltText}
                  onChange={(e) => setModalAltText(e.target.value)}
                  placeholder="e.g. Hands-free automated hulling machinery"
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Display Position / Order
                  </label>
                  <input
                    type="number"
                    value={modalPosition}
                    onChange={(e) => setModalPosition(parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={modalEnabled}
                      onChange={(e) => setModalEnabled(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-xs font-bold text-gray-700">Display on website</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !modalImageUrl}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Image</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT GALLERY PHOTO */}
      {/* ======================================================== */}
      {galleryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 text-left max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-gray-900 font-sans">
                {editingGalleryItem ? 'Edit Gallery Photo' : 'Upload New Gallery Photo'}
              </h3>
              <button
                onClick={() => {
                  setGalleryModalOpen(false);
                  setEditingGalleryItem(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGalleryItem} className="space-y-4">
              <ImageUploader
                token={token}
                currentImageUrl={galImageUrl}
                category="gallery"
                label="Select Photo to Upload"
                onUploadSuccess={({ imageUrl, publicId }) => {
                  setGalImageUrl(imageUrl);
                  setGalPublicId(publicId);
                }}
                onRemove={() => {
                  setGalImageUrl('');
                  setGalPublicId('');
                }}
              />

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Category
                </label>
                <select
                  value={galCategory}
                  onChange={(e: any) => setGalCategory(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Products">Products</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Production Process">Production Process</option>
                  <option value="Company Events">Company Events</option>
                  <option value="Customers">Customers</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Photo Title
                </label>
                <input
                  type="text"
                  value={galTitle}
                  onChange={(e) => setGalTitle(e.target.value)}
                  placeholder="e.g. Aseptic Nitrogen Pouch Sealing"
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Short Description
                </label>
                <textarea
                  value={galDescription}
                  onChange={(e) => setGalDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief note about this photograph"
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setGalleryModalOpen(false);
                    setEditingGalleryItem(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !galImageUrl}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingGalleryItem ? 'Update Photo' : 'Save to Gallery'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PRODUCT IMAGE UPLOAD */}
      {/* ======================================================== */}
      {productImageModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 text-left max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-gray-900 font-sans">
                  {isPrimaryFeatured ? 'Replace Featured Image' : 'Add Secondary Product Image'}
                </h3>
                <p className="text-xs text-emerald-800 font-bold">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setProductImageModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductImage} className="space-y-4">
              <ImageUploader
                token={token}
                currentImageUrl={prodUploadedUrl}
                category="products"
                label="Product Photograph"
                recommendedDimensions="Recommended: 800x800 square with clean background"
                onUploadSuccess={({ imageUrl, publicId }) => {
                  setProdUploadedUrl(imageUrl);
                  setProdUploadedPublicId(publicId);
                }}
                onRemove={() => {
                  setProdUploadedUrl('');
                  setProdUploadedPublicId('');
                }}
              />

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={prodAltText}
                  onChange={(e) => setProdAltText(e.target.value)}
                  placeholder={`e.g. ${selectedProduct.name} packaging front`}
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setProductImageModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !prodUploadedUrl}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Product Image</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
