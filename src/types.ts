export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number; // in TZS
  image: string;
  sizes: string[]; // e.g., ["100g", "250g", "500g", "1kg"]
  ingredients: string;
  benefits: string;
  createdAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  productId: string;
  productName?: string; // Hydrated on backend or frontend
  quantity: number;
  size: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  image: string;
  category: 'Products' | 'Packaging' | 'Production Process' | 'Company Events' | 'Customers';
  createdAt: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  visitors: number;
  pageViews: Record<string, number>;
  popularProducts: Record<string, number>;
  totalSales: number; // Sum of completed order values (mocked or actual)
}
