'use client';

import { useState } from 'react';
import { useDeliveryNotifications } from '../contexts/delivery-notification-context';
import { Bell, X, Check, Loader2, Package, MapPin, Phone, Navigation, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';

export function DeliveryNotificationBell() {
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, clearNotifications } = useDeliveryNotifications();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-600 text-white text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
            <div
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Delivery Notifications</SheetTitle>
            <SheetDescription>
              {isConnected ? (
                <span className="flex items-center gap-2 text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Connected - Receiving live notifications
                </span>
              ) : (
                <span className="flex items-center gap-2 text-red-600">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Disconnected - Reconnecting...
                </span>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
            </p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNotifications}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8"
                >
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No notifications yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    New delivery assignments will appear here
                  </p>
                </motion.div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      notification.read
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-orange-600 text-white">
                            New Delivery
                          </Badge>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-orange-600" />
                          )}
                        </div>
                        <p className="font-medium text-gray-900">
                          Order #{notification.data.orderId}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          From: {notification.data.outletName}
                        </p>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{notification.data.deliveryAddress.addressLine1}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${notification.data.customerPhone}`} className="text-blue-600 hover:underline">
                              {notification.data.customerPhone}
                            </a>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              const { latitude, longitude, addressLine1 } = notification.data.deliveryAddress;
                              const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Get Directions
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {notification.timestamp instanceof Date
                            ? notification.timestamp.toLocaleTimeString()
                            : new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
