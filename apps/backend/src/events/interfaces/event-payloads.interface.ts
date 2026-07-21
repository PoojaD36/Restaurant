// Order Events
export interface OrderCreatedEvent {
  orderId: number;
  outletId: number;
  outletName: string;
  restaurantId: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  status: string;
  items: Array<{
    menuItemId: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: {
    label: string;
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  specialInstructions?: string;
  payment?: {
    method: string;
    status: string;
  };
  createdAt: Date;
}

export interface OrderStatusUpdatedEvent {
  orderId: number;
  previousStatus: string;
  newStatus: string;
  customerId: number;
  outletId: number;
  outletName: string;
  restaurantId: number;
  total: number;
  timestamp: Date;
}

export interface OrderCancelledEvent {
  orderId: number;
  customerId: number;
  outletId: number;
  restaurantId: number;
  cancellationReason?: string;
  total: number;
  timestamp: Date;
}

export interface OrderPaidEvent {
  orderId: number;
  paymentId: number;
  amount: number;
  method: string;
  status: string;
  transactionId?: string;
  customerId: number;
  outletId: number;
  timestamp: Date;
}

export interface DeliveryAgentAssignedEvent {
  orderId: number;
  deliveryAgentId: number;
  deliveryAgentName: string;
  deliveryAgentPhone: string;
  outletId: number;
  outletName: string;
  customerId: number;
  customerPhone: string;
  customerAddress: any;
  total: number;
  assignedAt: Date;
}

export interface OrderPreparingEvent {
  orderId: number;
  chefId: number;
  chefName: string;
  outletId: number;
  outletName: string;
  customerId: number;
  total: number;
  startedAt: Date;
}

export interface OrderReadyEvent {
  orderId: number;
  chefId: number;
  chefName: string;
  outletId: number;
  outletName: string;
  customerId: number;
  total: number;
  completedAt: Date;
}

export interface OrderDeliveredEvent {
  orderId: number;
  customerId: number;
  outletId: number;
  deliveryAgentId: number;
  total: number;
  paymentMethod: string;
  deliveredAt: Date;
}

// Customer Events
export interface CustomerRegisteredEvent {
  customerId: number;
  name: string;
  email: string;
  phone: string;
  registeredAt: Date;
}

export interface AddressAddedEvent {
  customerId: number;
  addressId: number;
  address: string;
  addedAt: Date;
}

// Offer Events
export interface OfferAppliedEvent {
  offerId: number;
  code: string;
  customerId: number;
  orderId: number;
  discountAmount: number;
  appliedAt: Date;
}