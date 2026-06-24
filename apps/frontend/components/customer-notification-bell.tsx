'use client';

/**
 * Customer Notification Bell Component
 *
 * Displays a notification bell icon with unread count badge in the customer header.
 * Opens the customer notification panel when clicked.
 */

import { Bell, BellRing } from 'lucide-react';
import { useState } from 'react';
import { useCustomerNotifications } from '@/contexts/customer-notification-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomerNotificationPanel } from './customer-notification-panel';

export function CustomerNotificationBell() {
  const { unreadCount, isConnected } = useCustomerNotifications();
  const [isOpen, setIsOpen] = useState(false);

  console.log('[CustomerNotificationBell] Render - unreadCount:', unreadCount, 'isConnected:', isConnected);

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setIsOpen(true)}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 animate-pulse" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Connection status indicator */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={isConnected ? 'Notifications connected' : 'Notifications disconnected'}
        />
      </div>

      <CustomerNotificationPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
