/**
 * WebSocket Notification Service
 *
 * Handles real-time order notifications for restaurant admins/managers.
 * Connects to the backend WebSocket gateway and listens for order events.
 *
 * Events:
 * - 'connected': Connection established
 * - 'order.created': New order placed
 * - 'order.updated': Order status updated
 * - 'order.cancelled': Order cancelled by customer
 * - 'error': Error occurred
 */

import { io, Socket } from 'socket.io-client';

export type NotificationType = 'order.created' | 'order.updated' | 'order.cancelled';

export interface OrderNotification {
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

export interface NotificationCallback {
  (data: OrderNotification): void;
}

class NotificationSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners = new Map<string, Set<NotificationCallback>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Connect to WebSocket server
   * @param token - JWT authentication token
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[Notifications] Already connected');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const wsUrl = apiUrl.replace(/^http/, 'ws');

    console.log('[Notifications] Connecting to:', wsUrl);
    console.log('[Notifications] Token present:', !!token, 'Token length:', token?.length);

    this.socket = io(`${wsUrl}/notifications`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[Notifications] Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Notifications] Disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connected', (data) => {
      console.log('[Notifications] Connection acknowledged:', data);
    });

    this.socket.on('error', (error) => {
      console.error('[Notifications] Error:', error);
    });

    // Set up order event listeners
    this.setupOrderListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('[Notifications] Disconnected');
    }
  }

  /**
   * Subscribe to restaurant notifications
   * @param restaurantId - Restaurant ID to subscribe to
   */
  subscribeToRestaurant(restaurantId: number): void {
    if (!this.socket || !this.isConnected) {
      console.warn('[Notifications] Cannot subscribe: Not connected');
      return;
    }

    this.socket.emit('subscribe:restaurant', { restaurantId });
    console.log(`[Notifications] Subscribed to restaurant ${restaurantId}`);
  }

  /**
   * Unsubscribe from restaurant notifications
   * @param restaurantId - Restaurant ID to unsubscribe from
   */
  unsubscribeFromRestaurant(restaurantId: number): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('unsubscribe:restaurant', { restaurantId });
    console.log(`[Notifications] Unsubscribed from restaurant ${restaurantId}`);
  }

  /**
   * Add event listener for notification type
   * @param event - Event type to listen for
   * @param callback - Callback function
   */
  on(event: NotificationType, callback: NotificationCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Also register with socket if connected
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   * @param event - Event type
   * @param callback - Callback function to remove
   */
  off(event: NotificationType, callback: NotificationCallback): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Check if connected to server
   */
  connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Set up listeners for order events
   */
  private setupOrderListeners(): void {
    if (!this.socket) return;

    // Order created
    this.socket.on('order.created', (data: OrderNotification) => {
      console.log('[Notifications] Order created:', data);
      this.notifyListeners('order.created', data);
    });

    // Order updated
    this.socket.on('order.updated', (data: OrderNotification) => {
      console.log('[Notifications] Order updated:', data);
      this.notifyListeners('order.updated', data);
    });

    // Order cancelled
    this.socket.on('order.cancelled', (data: OrderNotification) => {
      console.log('[Notifications] Order cancelled:', data);
      this.notifyListeners('order.cancelled', data);
    });
  }

  /**
   * Notify all registered listeners for an event
   */
  private notifyListeners(event: NotificationType, data: OrderNotification): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }
}

// Singleton instance
export const notificationSocket = new NotificationSocketService();
