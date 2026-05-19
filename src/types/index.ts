export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'brand';
  avatar?: string | null;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface Brand {
  _id: string;
  name: string;
  description: string;
  logo?: string | null;
  owner: Pick<User, '_id' | 'name' | 'email' | 'avatar'>;
  category: 'fashion' | 'electronics' | 'food' | 'beauty' | 'sports' | 'home' | 'toys' | 'books' | 'other';
  website?: string | null;
  isActive: boolean;
  totalSales: number;
  createdAt: string;
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  brand: Pick<Brand, '_id' | 'name' | 'logo' | 'category'>;
  stock: number;
  category: string;
  isAvailable: boolean;
  tags: string[];
  createdAt: string;
}

export interface OrderItem {
  product: string;
  brand: string;
  title: string;
  image?: string | null;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  user: Pick<User, '_id' | 'name' | 'email' | 'avatar'>;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
    phone: string;
  };
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  notes?: string;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
