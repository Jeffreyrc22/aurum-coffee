export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
}
export interface Category {
  id: number;
  name: string;
  slug: string;
}
export interface Product {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  currency: string;
  category: Category;
  origin: string;
  roastLevel: string;
  weight: number;
  stock: number;
  mainImage: string;
  galleryImages: string[];
  active: boolean;
  featured: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface Catalog {
  items: Product[];
  total: number;
  pages: number;
  page: number;
}
export interface CartItem {
  productId: number;
  quantity: number;
}
export interface Order {
  id: number;
  reference: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  recipient: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  items: { productId: number; name: string; price: number; quantity: number }[];
}
export interface Stats {
  totalProducts: number;
  activeProducts: number;
  lowStock: number;
  totalOrders: number;
  pendingOrders: number;
  demoRevenue: number;
  ordersByDate: Record<string, number>;
}
export interface Movement {
  id: number;
  productId: number;
  delta: number;
  reason: string;
  createdAt: string;
}
