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

export interface AvailabilitySchedule {
  type: 'seasonal' | 'weekly' | 'custom';
  seasons?: {
    summer: boolean;
    winter: boolean;
    spring: boolean;
    autumn: boolean;
  };
  weeklySchedule?: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  customDates?: {
    startDate: string;
    endDate: string;
  }[];
}

export interface DataItem {
  id: string;
  title: string;
  description?: string;
  content: string;
  price: number;
  oldPrice?: number;
  stock: number;
  lowStockAlert: number;
  isInStock: boolean;
  trackInventory: boolean;
  image: string;
  category: string | Category;
  categoryId?: string;
  status: string;
  rating: number;
  userId: string;
  createdAt: string;
  updatedAt: string;

  // Advanced inventory fields
  reservedStock: number;
  availableStock: number;
  totalOrdered: number;
  totalSold: number;
  lastRestockDate?: string;

  // Perishable product fields
  isPerishable: boolean;
  shelfLifeDays?: number;
  productionDate?: string;
  expiryDate?: string;
  warrantyDays?: number;
  storageInstructions?: string;
  consumeBeforeNote?: string;

  // Unit and quantity fields
  unitType: 'piece' | 'kg' | 'liter' | 'gram' | 'ml';
  unitName: string;
  minQuantity: number;
  maxQuantity?: number;
  quantityStep: number;
  allowFractional: boolean;

  // Advance order fields
  requiresAdvanceOrder: boolean;
  advanceOrderDays: number;
  advanceOrderHours: number;

  // Delivery configuration fields
  customDeliveryRules: boolean;
  deliveryTimeHours?: number;
  deliveryTimeDays?: number;
  availableDeliveryDays?: string | number[]; // Can be JSON string from DB or parsed array
  specialHandling?: string;

  // Availability settings
  availabilityType: 'always' | 'seasonal' | 'scheduled';
  availabilitySchedule?: AvailabilitySchedule;
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

export interface StockMovement {
  id: string;
  dataItemId: string;
  type: 'IN' | 'OUT' | 'RESERVED' | 'RELEASED' | 'EXPIRED' | 'DAMAGED';
  quantity: number;
  reason?: string;
  orderId?: string;
  userId?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE';
  isActive: boolean;
  description?: string;
  icon?: string;
  settings?: Record<string, any>;
}

export interface DeliverySettings {
  id: string;
  name: string;
  isActive: boolean;
  deliveryTimeHours?: number;
  deliveryTimeDays?: number;
  availableDeliveryDays?: number[];
  deliveryAreas?: string[];
  minimumOrderValue?: number;
  deliveryCost: number;
  freeDeliveryThreshold?: number;
}


