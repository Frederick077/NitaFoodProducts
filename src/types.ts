export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin';
  createdAt: string;
}

export interface ProductImage {
  id: string;
  productId?: string;
  imageUrl: string;
  storagePublicId?: string;
  altText: string;
  position: number;
  createdAt?: string;
}

export interface ProductVariant {
  id: string;
  productId?: string;
  name: string;
  size: string; // e.g. "250g", "500g", "1kg", "Pack of 5"
  price: number; // in TZS
  compareAtPrice?: number | null; // in TZS for strikethrough discount
  available: boolean;
  stock: number;
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  category: string;
  featuredImageUrl: string;
  featuredImagePublicId?: string;
  available: boolean;
  isFeatured: boolean;
  ingredients: string;
  benefits: string;
  images: ProductImage[];
  variants: ProductVariant[];
  // Convenience aliases for backward compatibility & easy access
  price: number; // Lowest / base variant price
  compareAtPrice?: number | null;
  image: string; // Primary image URL
  sizes: string[]; // List of available size names
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  productId: string;
  productName?: string;
  productPrice?: number;
  variantId?: string;
  quantity: number;
  size: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  title?: string;
  description?: string;
  image: string;
  imageUrl?: string;
  storagePublicId?: string;
  altText?: string;
  position?: number;
  enabled?: boolean;
  category: 'Products' | 'Packaging' | 'Production Process' | 'Company Events' | 'Customers';
  createdAt: string;
  updatedAt?: string;
}

export type SiteImageSection = 'PRODUCTION' | 'FACTORY' | 'QUALITY_CERTIFICATIONS';

export interface SiteImage {
  id: string;
  section: SiteImageSection;
  imageUrl: string;
  storagePublicId?: string;
  altText?: string;
  title?: string;
  position: number;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  status?: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  visitors: number;
  pageViews: Record<string, number>;
  popularProducts: Record<string, number>;
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  orders?: Order[];
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  eyebrow: string;
  headline: string;
  ctaText: string;
  ctaLink: string;
  enabled: boolean;
  position: number;
}
