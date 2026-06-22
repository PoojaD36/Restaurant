'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Utensils, LayoutDashboard, LogOut, Key, Users, ChevronLeft, ChevronRight, Menu, X, Building2, MapPin, LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ChangePasswordModal } from '../../components/change-password-modal';

type UserRole = 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'OUTLET_ADMIN';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  requiresRole?: UserRole;
  allowedRoles?: UserRole[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const navItems: NavItem[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/users', icon: Users, label: 'Manage Users', requiresRole: 'SUPER_ADMIN' },
    { href: '/dashboard/restaurants', icon: Building2, label: 'My Restaurants', allowedRoles: ['SUPER_ADMIN', 'RESTAURANT_ADMIN'] },
    { href: '/dashboard/outlets', icon: MapPin, label: 'My Outlets', allowedRoles: ['SUPER_ADMIN', 'RESTAURANT_ADMIN'] },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (item.requiresRole) {
      return user?.role === item.requiresRole;
    }
    if (item.allowedRoles) {
      return item.allowedRoles.includes(user?.role as UserRole);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-b border-orange-200 z-50">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-orange-600"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-red-600 to-orange-500 p-1.5 rounded-lg shadow-md">
                <Utensils className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                Restaurant Admin
              </span>
            </Link>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-white/95 backdrop-blur-sm z-40 overflow-y-auto">
          <div className="p-4 space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block"
                >
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={`w-full justify-start ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
                        : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <div className="border-t border-orange-200 pt-4 mt-4 space-y-2">
              <Button
                onClick={() => {
                  setShowChangePasswordModal(true);
                  setMobileMenuOpen(false);
                }}
                variant="ghost"
                className="w-full justify-start text-slate-600 hover:text-orange-600 hover:bg-orange-50"
              >
                <Key className="h-5 w-5 mr-3" />
                Change Password
              </Button>
            </div>
            <div className="border-t border-orange-200 pt-4 mt-4">
              <div className="px-3 py-2 text-sm text-slate-600">
                <p className="font-medium">{user?.firstName || user?.email}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 bottom-0 flex-col bg-white/95 backdrop-blur-sm border-r border-orange-200 transition-all duration-300 z-50 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-orange-200">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-red-600 to-orange-500 p-1.5 rounded-lg shadow-md">
                <Utensils className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                Restaurant Admin
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="mx-auto">
              <div className="bg-gradient-to-br from-red-600 to-orange-500 p-1.5 rounded-lg shadow-md">
                <Utensils className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-slate-500 hover:text-orange-600 hover:bg-orange-50 hidden md:flex"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={`w-full justify-start ${
                    sidebarCollapsed ? 'px-3' : 'px-4'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600'
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Actions */}
        <div className="border-t border-orange-200 p-2 space-y-1">
          <Button
            onClick={() => setShowChangePasswordModal(true)}
            variant="ghost"
            className={`w-full justify-start text-slate-600 hover:text-orange-600 hover:bg-orange-50 ${
              sidebarCollapsed ? 'px-3' : 'px-4'
            }`}
          >
            <Key className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-3">Change Password</span>}
          </Button>

          {!sidebarCollapsed && (
            <div className="px-4 py-3 rounded-lg bg-orange-50/50">
              <p className="text-sm font-medium text-slate-700 truncate">
                {user?.firstName || user?.email}
              </p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
          )}

          <Button
            onClick={handleLogout}
            variant="ghost"
            className={`w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50 ${
              sidebarCollapsed ? 'px-3' : 'px-4'
            }`}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        } pt-16 md:pt-0`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
