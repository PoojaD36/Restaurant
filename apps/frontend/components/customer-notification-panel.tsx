'use client';

/**
 * Customer Notification Panel Component
 *
 * Displays a panel with all customer notifications, allows marking as read and clearing notifications.
 * Each notification can be clicked to navigate to the order details page.
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCustomerNotifications } from '@/contexts/customer-notification-context';
import { useRouter } from 'next/navigation';
import { Clock, Check, CheckCheck, Trash2, X, Bell, CheckCircle, Package, Truck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CustomerNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerNotificationPanel({ isOpen, onClose }: CustomerNotificationPanelProps) {
  const router = useRouter();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useCustomerNotifications();

  const handleNotificationClick = (notificationId: string, orderId: number) => {
    markAsRead(notificationId);
    // Navigate to order details page
    router.push(`/customer/orders/${orderId}`);
    onClose();
  };

  const handleOrderClick = (e: React.MouseEvent, orderId: number) => {
    e.stopPropagation();
    router.push(`/customer/orders/${orderId}`);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Order Notifications</SheetTitle>
          <SheetDescription>
            {notifications.length === 0
              ? 'No notifications yet'
              : `${notifications.length} notification${notifications.length > 1 ? 's' : ''}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={notifications.every(n => n.read)}
            className="flex-1"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-180px)] mt-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No order notifications</p>
              <p className="text-sm text-muted-foreground mt-1">
                You'll see updates when your order status changes
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <CustomerNotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => handleNotificationClick(notification.id, notification.orderId)}
                  onClear={() => clearNotification(notification.id)}
                  onOrderClick={(e) => handleOrderClick(e, notification.orderId)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface CustomerNotificationItemProps {
  notification: any;
  onRead: () => void;
  onClear: () => void;
  onOrderClick: (e: React.MouseEvent) => void;
}

function CustomerNotificationItem({ notification, onRead, onClear, onOrderClick }: CustomerNotificationItemProps) {
  const getIcon = () => {
    switch (notification.data.status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'PREPARING':
        return <Package className="h-6 w-6 text-orange-600" />;
      case 'READY':
        return <Bell className="h-6 w-6 text-blue-600" />;
      case 'OUT_FOR_DELIVERY':
        return <Truck className="h-6 w-6 text-purple-600" />;
      case 'DELIVERED':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'CANCELLED':
        return <X className="h-6 w-6 text-red-600" />;
      default:
        return <Bell className="h-6 w-6 text-gray-600" />;
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
        notification.read ? 'bg-muted/30' : 'bg-background border-primary/50'
      }`}
      onClick={onRead}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm">{notification.title}</p>
            <div className="flex items-center gap-1 shrink-0">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRead();
                  }}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(notification.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <Button
              variant="link"
              size="sm"
              className="h-7 p-0 text-xs"
              onClick={onOrderClick}
            >
              View Order →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
