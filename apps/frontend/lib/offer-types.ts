// Offer Module Types for Frontend

export enum OfferType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  FREE_DELIVERY = 'FREE_DELIVERY',
  BUY_ONE_GET_ONE = 'BUY_ONE_GET_ONE',
}

export enum OfferStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  SCHEDULED = 'SCHEDULED',
}

export enum OfferScope {
  PUBLIC = 'PUBLIC',
  RESTAURANT = 'RESTAURANT',
  OUTLET = 'OUTLET',
}

export enum OfferCombinationType {
  EXCLUSIVE = 'EXCLUSIVE',
  STACKABLE = 'STACKABLE',
  BEST_DEAL = 'BEST_DEAL',
}

export interface DiscountResult {
  discountAmount: number;
  discountType: OfferType;
  originalAmount: number;
  finalAmount: number;
  savings: number;
  deliveryFeeWaived: boolean;
  freeItems?: number[];
  applicableItems?: number[];
}

export interface Offer {
  id: number;
  name: string;
  description?: string;
  code: string;
  type: OfferType;
  status: OfferStatus;
  scope: OfferScope;
  restaurantId?: number;
  restaurant?: {
    id: number;
    name: string;
  };
  percentageValue?: number;
  fixedAmountValue?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  requireCode: boolean;
  isVisible: boolean;
  maxUses?: number;
  maxUsesPerCustomer: number;
  priority: number;
  startDate: string;
  endDate: string;
  validDays?: number[];
  validTimeStart?: string;
  validTimeEnd?: string;
  firstOrderOnly: boolean;
  combinationType: OfferCombinationType;
  currentUses?: number;
  outletIds?: number[];
  outlets?: OutletOffer[];
  categoryIds?: number[];
  categories?: CategoryOffer[];
  menuItemIds?: number[];
  menuItems?: MenuItemOffer[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface OutletOffer {
  outletId: number;
  outlet?: {
    id: number;
    name: string;
  };
}

export interface CategoryOffer {
  categoryId: number;
  category?: {
    id: number;
    name: string;
  };
}

export interface MenuItemOffer {
  menuItemId: number;
  menuItem?: {
    id: number;
    name: string;
  };
}

export interface OfferUsage {
  id: number;
  offerId: number;
  customerId: number;
  orderId: number;
  discountAmount: number;
  usedAt: string;
  offer?: {
    id: number;
    name: string;
    code: string;
    type: OfferType;
  };
  order?: {
    id: number;
    total: number;
  };
}

export interface OfferStats {
  totalUses: number;
  uniqueCustomers: number;
  totalDiscountGiven: number;
  averageOrderValue: number;
  usesLast7Days: number;
  usesLast30Days: number;
}

export interface OfferOverview {
  total: number;
  active: number;
  draft: number;
  expired: number;
  scheduled: number;
}

export interface CreateOfferRequest {
  name: string;
  description?: string;
  code: string;
  type: OfferType;
  status: OfferStatus;
  scope: OfferScope;
  restaurantId?: number;
  percentageValue?: number;
  fixedAmountValue?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  requireCode: boolean;
  isVisible: boolean;
  maxUses?: number;
  maxUsesPerCustomer: number;
  priority: number;
  startDate: string;
  endDate: string;
  validDays?: number[];
  validTimeStart?: string;
  validTimeEnd?: string;
  firstOrderOnly: boolean;
  combinationType: OfferCombinationType;
  outletIds?: number[];
  categoryIds?: number[];
  menuItemIds?: number[];
}

export interface UpdateOfferRequest {
  name?: string;
  description?: string;
  code?: string;
  type?: OfferType;
  status?: OfferStatus;
  scope?: OfferScope;
  restaurantId?: number;
  percentageValue?: number;
  fixedAmountValue?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  requireCode?: boolean;
  isVisible?: boolean;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  priority?: number;
  startDate?: string;
  endDate?: string;
  validDays?: number[];
  validTimeStart?: string;
  validTimeEnd?: string;
  firstOrderOnly?: boolean;
  combinationType?: OfferCombinationType;
  outletIds?: number[];
  categoryIds?: number[];
  menuItemIds?: number[];
}

export interface OfferFilter {
  page?: number;
  limit?: number;
  type?: OfferType;
  status?: OfferStatus;
  scope?: OfferScope;
  restaurantId?: number;
  search?: string;
}

export interface PaginatedOffersResponse {
  success: boolean;
  message: string;
  data: Offer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApplyOfferRequest {
  code: string;
  outletId: number;
  cartTotal: number;
  items: CartItem[];
}

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  categoryId?: number;
}

export interface ApplyOfferResponse {
  success: boolean;
  message: string;
  data?: {
    discount: DiscountResult;
    offer: {
      id: number;
      name: string;
      code: string;
      type: OfferType;
    };
  };
}

export interface AvailableOffersResponse {
  success: boolean;
  message: string;
  data: Offer[];
}

// Helper function to get offer type label
export function getOfferTypeLabel(type: OfferType): string {
  switch (type) {
    case OfferType.PERCENTAGE:
      return 'Percentage Off';
    case OfferType.FIXED:
      return 'Fixed Amount';
    case OfferType.FREE_DELIVERY:
      return 'Free Delivery';
    case OfferType.BUY_ONE_GET_ONE:
      return 'Buy One Get One';
    default:
      return type;
  }
}

// Helper function to get offer status label
export function getOfferStatusLabel(status: OfferStatus): string {
  switch (status) {
    case OfferStatus.DRAFT:
      return 'Draft';
    case OfferStatus.ACTIVE:
      return 'Active';
    case OfferStatus.PAUSED:
      return 'Paused';
    case OfferStatus.EXPIRED:
      return 'Expired';
    case OfferStatus.SCHEDULED:
      return 'Scheduled';
    default:
      return status;
  }
}

// Helper function to get offer scope label
export function getOfferScopeLabel(scope: OfferScope): string {
  switch (scope) {
    case OfferScope.PUBLIC:
      return 'Public';
    case OfferScope.RESTAURANT:
      return 'Restaurant';
    case OfferScope.OUTLET:
      return 'Outlet';
    default:
      return scope;
  }
}

// Helper function to get offer status badge color
export function getOfferStatusColor(status: OfferStatus): string {
  switch (status) {
    case OfferStatus.ACTIVE:
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case OfferStatus.DRAFT:
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case OfferStatus.PAUSED:
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case OfferStatus.EXPIRED:
      return 'bg-red-100 text-red-700 border-red-200';
    case OfferStatus.SCHEDULED:
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

// Helper function to get offer type badge color
export function getOfferTypeColor(type: OfferType): string {
  switch (type) {
    case OfferType.PERCENTAGE:
      return 'bg-teal-100 text-teal-700 border-teal-200';
    case OfferType.FIXED:
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case OfferType.FREE_DELIVERY:
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case OfferType.BUY_ONE_GET_ONE:
      return 'bg-pink-100 text-pink-700 border-pink-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}
