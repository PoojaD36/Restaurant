// Order types for the application

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  WALLET = 'WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface OrderModifier {
  modifierGroupId: number;
  modifierGroupName: string;
  type: 'SINGLE' | 'MULTIPLE';
  selectedOptions: Array<{
    id: number;
    name: string;
    priceAdjustment: number;
  }>;
}

export interface OrderItem {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  modifiers: OrderModifier[];
  createdAt: string;
}

export interface OrderAddress {
  label: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface OrderOutlet {
  id: number;
  name: string;
  addressLine1: string;
  city: string;
  phone?: string;
}

export interface OrderPayment {
  id: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
}

export interface Order {
  id: number;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  specialInstructions?: string;
  estimatedDeliveryTime?: number;
  deliveryAddress: OrderAddress;
  createdAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  outlet: OrderOutlet;
  items: OrderItem[];
  payment?: OrderPayment;
}

export interface OrderListItem {
  id: number;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  specialInstructions?: string;
  estimatedDeliveryTime?: number;
  createdAt: string;
  deliveredAt?: string;
  deliveryName?: string;
  deliveryPhone?: string;
  deliveryAddressLine1?: string;
  deliveryCity?: string;
  outlet: OrderOutlet;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  outletId: number;
  addressId: number;
  items: Array<{
    menuItemId: number;
    name: string;
    price: number;
    quantity: number;
    modifiers: OrderModifier[];
  }>;
  specialInstructions?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    orderId: number;
    status: OrderStatus;
    subtotal: number;
    deliveryFee: number;
    total: number;
    estimatedDeliveryTime?: number;
    items: OrderItem[];
  };
}

export interface GetOrdersResponse {
  success: boolean;
  message: string;
  data: OrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
    from: number;
    to: number;
  };
}

export interface GetOrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface CancelOrderResponse {
  success: boolean;
  message: string;
  data: {
    orderId: number;
    status: OrderStatus;
  };
}
