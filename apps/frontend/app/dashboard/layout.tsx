'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Utensils, LayoutDashboard, LogOut, Key, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ChangePasswordModal } from '../../components/change-password-modal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/users', icon: Users, label: 'Manage Users', requiresRole: 'SUPER_ADMIN' as const },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-orange-200 bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-red-600 to-orange-500 p-1.5 rounded-lg shadow-md">
                  <Utensils className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                  Restaurant Admin
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navItems
                  .filter((item) => !item.requiresRole || user?.role === item.requiresRole)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={isActive ? 'default' : 'ghost'}
                          size="sm"
                          className={
                            isActive
                              ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600'
                              : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                          }
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowChangePasswordModal(true)}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-orange-600 hover:bg-orange-50"
              >
                <Key className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Change Password</span>
              </Button>

              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">
                  {user?.firstName || user?.email}
                </p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b border-orange-200 bg-white/90 backdrop-blur">
        <div className="flex px-4 py-2 gap-2">
          {navItems
            .filter((item) => !item.requiresRole || user?.role === item.requiresRole)
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                        : 'text-slate-600'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
}
