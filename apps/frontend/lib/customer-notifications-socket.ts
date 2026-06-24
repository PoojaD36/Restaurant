/**
 * WebSocket Notification Service for Customers
 *
 * Handles real-time order status notifications for customers.
 * Connects to the backend WebSocket gateway and listens for order events.
 *
 * Events:
 * - 'connected': Connection established
 * - 'order.status.updated': Order status updated by restaurant
 * - 'error': Error occurred
 */

import { io, Socket } from 'socket.io-client';

export interface CustomerOrderNotification {
  orderId: number;
  status: string;
  previousStatus?: string;
  total?: number;
  deliveredAt?: Date | string;
}

export interface CustomerNotificationCallback {
  (data: CustomerOrderNotification): void;
}

class CustomerNotificationSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners = new Map<string, Set<CustomerNotificationCallback>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Connect to WebSocket server
   * @param token - JWT authentication token (customer token)
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[Customer Notifications] Already connected');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const wsUrl = apiUrl.replace(/^http/, 'ws');

    console.log('[Customer Notifications] Connecting to:', wsUrl);

    this.socket = io(`${wsUrl}/notifications`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[Customer Notifications] Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Customer Notifications] Disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connected', (data) => {
      console.log('[Customer Notifications] Connection acknowledged:', data);
    });

    this.socket.on('error', (error) => {
      console.error('[Customer Notifications] Error:', error);
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
      console.log('[Customer Notifications] Disconnected');
    }
  }

  /**
   * Add event listener for notification type
   * @param event - Event type to listen for
   * @param callback - Callback function
   */
  on(event: string, callback: CustomerNotificationCallback): void {
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
  off(event: string, callback: CustomerNotificationCallback): void {
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

    // Order status updated
    this.socket.on('order.status.updated', (data: CustomerOrderNotification) => {
      console.log('[Customer Notifications] Order status updated:', data);
      this.notifyListeners('order.status.updated', data);
    });
  }

  /**
   * Notify all registered listeners for an event
   */
  private notifyListeners(event: string, data: CustomerOrderNotification): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }
}

// Singleton instance
export const customerNotificationSocket = new CustomerNotificationSocketService();
