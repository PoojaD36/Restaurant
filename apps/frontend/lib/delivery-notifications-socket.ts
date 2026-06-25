import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface DeliveryNotificationData {
  orderId: number;
  outletId: number;
  outletName: string;
  status: string;
  total: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    latitude: number;
    longitude: number;
  };
}

export interface DeliveryNotification {
  id: string;
  type: 'order.assigned';
  data: DeliveryNotificationData;
  timestamp: Date;
  read: boolean;
}

class DeliveryNotificationsSocket {
  private socket: Socket | null = null;
  private listeners: Set<(notification: DeliveryNotification) => void> = new Set();
  private connectionListeners: Set<(isConnected: boolean) => void> = new Set();

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(`${API_URL}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Delivery notifications socket connected');
      this.connectionListeners.forEach(listener => listener(true));
    });

    this.socket.on('disconnect', () => {
      console.log('Delivery notifications socket disconnected');
      this.connectionListeners.forEach(listener => listener(false));
    });

    this.socket.on('error', (error: any) => {
      console.error('Delivery notifications socket error:', error);
    });

    this.socket.on('order.assigned', (data: DeliveryNotificationData) => {
      const notification: DeliveryNotification = {
        id: `order-${data.orderId}-${Date.now()}`,
        type: 'order.assigned',
        data,
        timestamp: new Date(),
        read: false,
      };
      this.listeners.forEach(listener => listener(notification));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onNotification(listener: (notification: DeliveryNotification) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onConnectionChange(listener: (isConnected: boolean) => void) {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const deliveryNotificationsSocket = new DeliveryNotificationsSocket();
