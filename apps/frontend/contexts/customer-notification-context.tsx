'use client';

/**
 * Customer Notification Context
 *
 * Provides real-time notification state for customers.
 * Handles WebSocket connection and order status update notifications.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { customerNotificationSocket, CustomerOrderNotification } from '@/lib/customer-notifications-socket';

interface CustomerNotification {
  id: string;
  type: 'order.status.updated';
  title: string;
  message: string;
  data: CustomerOrderNotification;
  timestamp: Date | string;
  read: boolean;
  orderId: number;
}

interface CustomerNotificationContextType {
  notifications: CustomerNotification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const CustomerNotificationContext = createContext<CustomerNotificationContextType | undefined>(undefined);

export function useCustomerNotifications() {
  const context = useContext(CustomerNotificationContext);
  if (!context) {
    throw new Error('useCustomerNotifications must be used within CustomerNotificationProvider');
  }
  return context;
}

interface CustomerNotificationProviderProps {
  children: ReactNode;
}

export function CustomerNotificationProvider({ children }: CustomerNotificationProviderProps) {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Create notification from WebSocket data
   */
  const createNotification = useCallback((
    data: CustomerOrderNotification,
  ): CustomerNotification => {
    const id = `status-${data.orderId}-${Date.now()}`;
    const timestamp = new Date();

    const statusMessages: Record<string, { title: string; message: string }> = {
      CONFIRMED: {
        title: 'Order Confirmed',
        message: `Your order #${data.orderId} has been confirmed! The restaurant is preparing your food.`,
      },
      PREPARING: {
        title: 'Order Being Prepared',
        message: `Your order #${data.orderId} is being prepared. It won't be long!`,
      },
      READY: {
        title: 'Order Ready',
        message: `Your order #${data.orderId} is ready for pickup!`,
      },
      OUT_FOR_DELIVERY: {
        title: 'Out for Delivery',
        message: `Your order #${data.orderId} is out for delivery and will arrive soon!`,
      },
      DELIVERED: {
        title: 'Order Delivered',
        message: `Your order #${data.orderId} has been delivered. Enjoy your meal!`,
      },
      CANCELLED: {
        title: 'Order Cancelled',
        message: `Your order #${data.orderId} has been cancelled.`,
      },
    };

    const statusInfo = statusMessages[data.status] || {
      title: 'Order Status Updated',
      message: `Your order #${data.orderId} status is now ${data.status}`,
    };

    return {
      id,
      type: 'order.status.updated',
      title: statusInfo.title,
      message: statusInfo.message,
      data,
      timestamp,
      read: false,
      orderId: data.orderId,
    };
  }, []);

  /**
   * Add notification to state
   */
  const addNotification = useCallback((notification: CustomerNotification) => {
    setNotifications(prev => {
      // Avoid duplicate notifications for the same order update
      const exists = prev.some(
        n => n.orderId === notification.orderId && n.data.status === notification.data.status,
      );
      if (exists) return prev;
      return [notification, ...prev].slice(0, 50); // Keep max 50 notifications
    });
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
    const token = localStorage.getItem('customerAccessToken');
    if (!token) {
      return;
    }

    // Connect to WebSocket
    customerNotificationSocket.connect(token);
    setIsConnected(customerNotificationSocket.connected());

    // Listen for order status updates
    const handleOrderStatusUpdated = (data: CustomerOrderNotification) => {
      const notification = createNotification(data);
      addNotification(notification);

      // Play notification sound (optional)
      if (typeof window !== 'undefined') {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
      }
    };

    customerNotificationSocket.on('order.status.updated', handleOrderStatusUpdated);

    // Cleanup on unmount
    return () => {
      customerNotificationSocket.off('order.status.updated', handleOrderStatusUpdated);
      customerNotificationSocket.disconnect();
    };
  }, [createNotification, addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: CustomerNotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };

  return (
    <CustomerNotificationContext.Provider value={value}>
      {children}
    </CustomerNotificationContext.Provider>
  );
}
