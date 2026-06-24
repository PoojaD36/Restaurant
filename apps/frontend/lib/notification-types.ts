/**
 * Notification types for admin dashboard
 */

export type NotificationType = 'order.created' | 'order.updated' | 'order.cancelled';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  read: boolean;
  orderId?: number;
}

export interface OrderNotificationData {
  orderId: number;
  outletId: number;
  outletName?: string;
  status: string;
  total?: number;
  createdAt?: Date;
  cancelledAt?: Date;
  items?: any[];
  deliveryAddress?: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
  };
  specialInstructions?: string;
}
