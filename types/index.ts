export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface DataItem {
  id: string;
  title: string;
  description?: string;
  content: string;
  price: number;
  oldPrice?: number;
  stock: number;
  image: string;
  category: string | Category;
  categoryId?: string;
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
