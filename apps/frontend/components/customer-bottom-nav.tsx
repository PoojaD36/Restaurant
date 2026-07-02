'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Package, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerNotificationBell } from '@/components/customer-notification-bell';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Home', path: '/customer', icon: Home },
  { label: 'Orders', path: '/customer/orders', icon: Package },
  { label: 'Profile', path: '/customer/profile', icon: User },
  { label: 'Alerts', path: '/customer', icon: Bell }, // Alerts stays on current page
];

export function CustomerBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/customer') {
      return pathname === '/customer' || pathname === '/customer/notifications';
    }
    return pathname === path;
  };

  const handleClick = (item: NavItem) => {
    if (item.label === 'Alerts') {
      // Don't navigate, just scroll to top or show notifications
      return;
    }
    router.push(item.path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex items-center justify-around h-16 max-w-7xl mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          // For Alerts, use the notification bell component
          // Use div instead of button to avoid nested button (CustomerNotificationBell renders a Button)
          if (item.label === 'Alerts') {
            return (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center flex-1 h-full relative cursor-pointer"
                onClick={() => handleClick(item)}
                aria-label={item.label}
              >
                <CustomerNotificationBell />
                <span className="text-xs mt-1 text-gray-600">Alerts</span>
              </div>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => handleClick(item)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                active ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
              )}
            >
              <Icon className={cn('h-6 w-6', active && 'stroke-2')} />
              <span className={cn('text-xs mt-1', active ? 'font-medium' : '')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
