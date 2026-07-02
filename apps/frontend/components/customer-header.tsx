'use client';

import { useCustomerAuth } from '@/contexts/customer-auth-context';
import { useLocation } from '@/contexts/location-context';
import { useRouter } from 'next/navigation';
import { Utensils, Navigation, LogOut, User, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerNotificationBell } from '@/components/customer-notification-bell';

interface CustomerHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function CustomerHeader({ title, showBackButton = false, onBackClick }: CustomerHeaderProps) {
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const { location, requestLocation } = useLocation();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/customer');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Section - Logo or Back Button */}
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBackClick}
                className="text-gray-700 hover:text-emerald-600"
              >
                <Navigation className="h-5 w-5 rotate-180" />
              </Button>
            ) : (
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => router.push('/customer')}
              >
                <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-2 rounded-lg">
                  <Utensils className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  FoodHub
                </span>
              </div>
            )}
            {title && (
              <h1 className="text-lg font-semibold text-gray-900 ml-2">{title}</h1>
            )}
          </div>

          {/* Right Section - Location, Icons, Logout */}
          <div className="flex items-center gap-2">
            {/* Location Detection */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => requestLocation()}
              className="text-gray-700 hover:text-emerald-600"
              title={location ? 'Location detected' : 'Detect location'}
            >
              <Navigation className="h-5 w-5" />
            </Button>

            {/* Authenticated User Icons (Desktop Only - hidden on mobile) */}
            {isAuthenticated && customer && (
              <div className="flex items-center gap-1">
                {/* My Profile Button - Desktop Only */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/customer/profile')}
                  className="text-gray-700 hover:text-emerald-600 hidden sm:flex"
                  title="My Profile"
                >
                  <User className="h-5 w-5" />
                </Button>

                {/* My Orders Button - Desktop Only */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/customer/orders')}
                  className="text-gray-700 hover:text-emerald-600 hidden sm:flex"
                  title="My Orders"
                >
                  <Package className="h-5 w-5" />
                </Button>

                {/* Notification Bell - Desktop Only */}
                <div className="hidden sm:flex">
                  <CustomerNotificationBell />
                </div>

                {/* User Name - Large Screens Only */}
                <span className="hidden lg:inline text-sm font-medium text-gray-700 px-2">
                  {customer.firstName}
                </span>

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-emerald-600"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
