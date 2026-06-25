'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { deliveryNotificationsSocket, DeliveryNotification } from '../lib/delivery-notifications-socket';
import { UserRole } from '../lib/types';

interface DeliveryNotificationContextType {
  notifications: DeliveryNotification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const DeliveryNotificationContext = createContext<DeliveryNotificationContextType | undefined>(undefined);

export function DeliveryNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Connect to WebSocket when user is authenticated as delivery agent
  useEffect(() => {
    if (user && user.role === 'DELIVERY_AGENT') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        deliveryNotificationsSocket.connect(token);

        // Clean up on unmount
        return () => {
          deliveryNotificationsSocket.disconnect();
        };
      }
    }
  }, [user]);

  // Listen for connection changes
  useEffect(() => {
    const unsubscribe = deliveryNotificationsSocket.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    return unsubscribe;
  }, []);

  // Listen for new notifications
  useEffect(() => {
    const unsubscribe = deliveryNotificationsSocket.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <DeliveryNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </DeliveryNotificationContext.Provider>
  );
}

export function useDeliveryNotifications() {
  const context = useContext(DeliveryNotificationContext);
  if (!context) {
    throw new Error('useDeliveryNotifications must be used within DeliveryNotificationProvider');
  }
  return context;
}
