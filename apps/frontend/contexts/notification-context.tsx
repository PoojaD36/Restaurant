'use client';

/**
 * Notification Context
 *
 * Provides real-time notification state and functions for the admin dashboard.
 * Handles WebSocket connection and notification management.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { notificationSocket, OrderNotification } from '@/lib/notifications-socket';
import { Notification, NotificationType, OrderNotificationData } from '@/lib/notification-types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Create notification from WebSocket data
   */
  const createNotification = useCallback((
    type: NotificationType,
    data: OrderNotificationData,
  ): Notification => {
    const id = `${type}-${data.orderId}-${Date.now()}`;
    const timestamp = data.createdAt || data.cancelledAt || new Date();

    let title = '';
    let message = '';

    switch (type) {
      case 'order.created':
        title = 'New Order Received';
        message = `Order #${data.orderId} from ${data.deliveryAddress?.name || 'Customer'} - ₹${data.total}`;
        break;
      case 'order.updated':
        title = 'Order Status Updated';
        message = `Order #${data.orderId} is now ${data.status}`;
        break;
      case 'order.cancelled':
        title = 'Order Cancelled';
        message = `Order #${data.orderId} was cancelled by customer`;
        break;
    }

    return {
      id,
      type,
      title,
      message,
      data,
      timestamp,
      read: false,
      orderId: data.orderId,
    };
  }, []);

  /**
   * Add notification to state
   */
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep max 50 notifications
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  /**
   * Clear specific notification
   */
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Setup WebSocket connection
   */
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('[Notifications] No access token found in localStorage');
      return;
    }

    console.log('[Notifications] Token found, attempting to connect...');

    // Connect to WebSocket
    notificationSocket.connect(token);
    setIsConnected(notificationSocket.connected());

    // Listen for order events
    const handleOrderCreated = (data: OrderNotification) => {
      const notification = createNotification('order.created', data);
      addNotification(notification);

      // Play notification sound (optional)
      if (typeof window !== 'undefined') {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
      }
    };

    const handleOrderUpdated = (data: OrderNotification) => {
      const notification = createNotification('order.updated', data);
      addNotification(notification);
    };

    const handleOrderCancelled = (data: OrderNotification) => {
      const notification = createNotification('order.cancelled', data);
      addNotification(notification);
    };

    notificationSocket.on('order.created', handleOrderCreated);
    notificationSocket.on('order.updated', handleOrderUpdated);
    notificationSocket.on('order.cancelled', handleOrderCancelled);

    // Cleanup on unmount
    return () => {
      notificationSocket.off('order.created', handleOrderCreated);
      notificationSocket.off('order.updated', handleOrderUpdated);
      notificationSocket.off('order.cancelled', handleOrderCancelled);
      notificationSocket.disconnect();
    };
  }, [createNotification, addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
