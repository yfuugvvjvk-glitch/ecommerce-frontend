import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function for public API calls
export const getPublicApiUrl = (path: string) => {
  return `${API_URL}${path}`;
};

// Request interceptor - add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Removed console.log for production
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    apiClient.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', data),
  me: () => apiClient.get('/api/auth/me'),
};

export const dataAPI = {
  getAll: (params?: any) => apiClient.get('/api/data', { params }),
  getById: (id: string) => apiClient.get(`/api/data/${id}`),
  create: (data: any) => apiClient.post('/api/data', data),
  update: (id: string, data: any) => apiClient.put(`/api/data/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/data/${id}`),
};

export const cartAPI = {
  getCart: () => apiClient.get('/api/cart'),
  addToCart: (dataItemId: string, quantity: number = 1) =>
    apiClient.post('/api/cart', { dataItemId, quantity }),
  updateQuantity: (cartItemId: string, quantity: number) =>
    apiClient.put(`/api/cart/${cartItemId}`, { quantity }),
  removeFromCart: (cartItemId: string) =>
    apiClient.delete(`/api/cart/${cartItemId}`),
  clearCart: () => apiClient.delete('/api/cart'),
};

export const voucherAPI = {
  validate: (code: string, cartTotal: number) =>
    apiClient.post('/api/vouchers/validate', { code, cartTotal }),
  getActive: () => apiClient.get('/api/vouchers/active'),
};

export const orderAPI = {
  create: (data: {
    items: Array<{ dataItemId: string; quantity: number; price: number }>;
    total: number;
    shippingAddress: string;
    voucherCode?: string;
  }) => apiClient.post('/api/orders', data),
  getMyOrders: () => apiClient.get('/api/orders/my'),
  getById: (id: string) => apiClient.get(`/api/orders/${id}`),
};

export const favoritesAPI = {
  getAll: () => apiClient.get('/api/user/favorites'),
  add: (dataItemId: string) => apiClient.post('/api/user/favorites', { dataItemId }),
  remove: (dataItemId: string) => apiClient.delete(`/api/user/favorites/${dataItemId}`),
  check: (dataItemId: string) => apiClient.get(`/api/user/favorites/check/${dataItemId}`),
};

export const categoryAPI = {
  getAll: () => apiClient.get('/api/categories'),
  create: (data: any) => apiClient.post('/api/categories', data),
  update: (id: string, data: any) => apiClient.put(`/api/categories/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/categories/${id}`),
};
