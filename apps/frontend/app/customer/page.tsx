'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomerAuthSheet } from '../../components/customer-auth-sheet';
import { useCustomerAuth } from '../../contexts/customer-auth-context';
import { useLocation } from '../../contexts/location-context';
import { getPublicOutlets, PublicOutlet } from '../../lib/public-api';
import { calculateDistance, formatDistance } from '../../lib/location-utils';
import { useRouter } from 'next/navigation';
import {
  Utensils, MapPin, LogOut, Loader2, User,
  Navigation, Package
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { CustomerNotificationBell } from '../../components/customer-notification-bell';

interface OutletWithDistance extends PublicOutlet {
  distance?: number;
}

export default function CustomerPage() {
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const { location, permissionStatus, requestLocation } = useLocation();
  const router = useRouter();

  const [outlets, setOutlets] = useState<OutletWithDistance[]>([]);
  const [rawOutlets, setRawOutlets] = useState<PublicOutlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Show location prompt on first visit
    const hasSeenPrompt = localStorage.getItem('location_prompt_seen');
    if (!hasSeenPrompt && permissionStatus === 'prompt') {
      setTimeout(() => {
        setShowLocationPrompt(true);
      }, 2000);
    }
  }, [permissionStatus]);

  useEffect(() => {
    // Show auth sheet if not authenticated (after location prompt)
    if (!isAuthenticated && !showLocationPrompt) {
      setTimeout(() => {
        setIsAuthSheetOpen(true);
      }, 1500);
    }
  }, [isAuthenticated, showLocationPrompt]);

  useEffect(() => {
    loadOutlets();
  }, []);

  // Calculate and sort by distance when location or outlets change
  useEffect(() => {
    if (location && rawOutlets.length > 0) {
      const outletsWithDistance = rawOutlets.map(outlet => ({
        ...outlet,
        distance: outlet.latitude && outlet.longitude
          ? calculateDistance(location.latitude, location.longitude, outlet.latitude, outlet.longitude)
          : undefined,
      })).filter(outlet => outlet.distance !== undefined);

      // Sort by distance
      outletsWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

      setOutlets(outletsWithDistance);
    } else {
      // No location, show unsorted
      setOutlets(rawOutlets.map(o => ({ ...o })));
    }
  }, [location, rawOutlets]);

  const loadOutlets = async () => {
    try {
      setIsLoading(true);
      const response = await getPublicOutlets(1, 100);
      if (response.success) {
        setRawOutlets(response.data);
      }
    } catch (error) {
      console.error('Failed to load outlets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAllowLocation = async () => {
    setShowLocationPrompt(false);
    localStorage.setItem('location_prompt_seen', 'true');
    await requestLocation();
  };

  const handleDenyLocation = () => {
    setShowLocationPrompt(false);
    localStorage.setItem('location_prompt_seen', 'true');
  };

  const handleLogout = async () => {
    await logout();
    setIsAuthSheetOpen(true);
  };

  const handleOutletClick = (outletId: number) => {
    if (isAuthenticated) {
      router.push(`/customer/menu/${outletId}`);
    } else {
      setAuthMode('login');
      setIsAuthSheetOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push('/')}
            >
              <div className="bg-gradient-to-br from-orange-600 to-amber-500 p-2 rounded-lg">
                <Utensils className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                FoodHub
              </span>
            </motion.div>

            {/* Right Section - Location & Auth */}
            <div className="flex items-center gap-2">
              {/* Location Detection */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => requestLocation()}
                className="text-gray-700 hover:text-orange-600"
                title={location ? 'Location detected' : 'Detect location'}
              >
                <Navigation className="h-5 w-5" />
              </Button>

              {/* Auth */}
              {isAuthenticated && customer ? (
                <div className="flex items-center gap-1">
                  {/* My Profile Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/customer/profile')}
                    className="text-gray-700 hover:text-orange-600 hidden sm:flex"
                    title="My Profile"
                  >
                    <User className="h-5 w-5" />
                  </Button>

                  {/* My Orders Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/customer/orders')}
                    className="text-gray-700 hover:text-orange-600 hidden sm:flex"
                    title="My Orders"
                  >
                    <Package className="h-5 w-5" />
                  </Button>

                  {/* Notification Bell */}
                  <CustomerNotificationBell />

                  {/* User Name */}
                  <span className="hidden lg:inline text-sm font-medium text-gray-700 px-2">
                    {customer.firstName}
                  </span>

                  {/* Logout Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-orange-600"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setAuthMode('login');
                      setIsAuthSheetOpen(true);
                    }}
                    className="text-gray-700 hover:text-orange-600"
                    title="Log in"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={() => {
                      setAuthMode('register');
                      setIsAuthSheetOpen(true);
                    }}
                    className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white"
                    title="Sign up"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {location ? 'Restaurants near you' : 'All Restaurants'}
          </h1>
        </div>

        {/* Restaurant List - Grid Layout for PC, Horizontal for Mobile */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : (
          <>
            {/* Desktop Grid Layout */}
            <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {outlets.map((outlet, index) => (
                  <motion.div
                    key={outlet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200 cursor-pointer group h-full flex flex-col"
                      onClick={() => handleOutletClick(outlet.id)}
                    >
                      {/* Image Section */}
                      <div className="relative h-40 bg-gradient-to-br from-orange-400 to-amber-400">
                        {outlet.restaurant.logo ? (
                          <img
                            src={outlet.restaurant.logo}
                            alt={outlet.restaurant.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Utensils className="h-12 w-12 text-white/40" />
                          </div>
                        )}
                        {outlet.distance !== undefined && outlet.distance < 2 && (
                          <Badge className="absolute top-3 left-3 bg-white text-orange-600 border-0">
                            {formatDistance(outlet.distance)}
                          </Badge>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-4 flex flex-col">
                        {/* Restaurant Name */}
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-bold text-gray-900 truncate flex-1">
                            {outlet.name}
                          </h3>
                        </div>

                        {/* Location & Distance */}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{outlet.city}</span>
                          {outlet.distance !== undefined && (
                            <span className="text-gray-400 shrink-0">• {formatDistance(outlet.distance)}</span>
                          )}
                        </div>

                        {/* Order Button */}
                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOutletClick(outlet.id);
                            }}
                          >
                            Order Now
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Mobile/Tablet Horizontal Layout */}
            <div className="lg:hidden space-y-4">
              <AnimatePresence>
                {outlets.map((outlet, index) => (
                  <motion.div
                    key={outlet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200 cursor-pointer"
                      onClick={() => handleOutletClick(outlet.id)}
                    >
                      <div className="flex">
                        {/* Image Section */}
                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-orange-400 to-amber-400 shrink-0">
                          {outlet.restaurant.logo ? (
                            <img
                              src={outlet.restaurant.logo}
                              alt={outlet.restaurant.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Utensils className="h-8 w-8 text-white/40" />
                            </div>
                          )}
                          {outlet.distance !== undefined && outlet.distance < 2 && (
                            <Badge className="absolute top-2 left-2 bg-white text-orange-600 border-0 text-xs">
                              {formatDistance(outlet.distance)}
                            </Badge>
                          )}
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 p-3 sm:p-4">
                          <h3 className="text-base font-bold text-gray-900 line-clamp-1 mb-1">
                            {outlet.name}
                          </h3>

                          {/* Location & Distance */}
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{outlet.city}</span>
                            {outlet.distance !== undefined && (
                              <span className="text-gray-400 shrink-0">• {formatDistance(outlet.distance)}</span>
                            )}
                          </div>

                          {/* Button */}
                          <div className="flex items-center justify-between mt-2">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white text-xs px-3 py-1 h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOutletClick(outlet.id);
                              }}
                            >
                              Order
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* No Results */}
            {!isLoading && outlets.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No restaurants found</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Location Permission Modal */}
      <AnimatePresence>
        {showLocationPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Navigation className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Show restaurants near you
                </h3>
                <p className="text-gray-600 mb-6">
                  We'll use your location to show nearby restaurants and calculate delivery distances.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleDenyLocation}
                    className="flex-1 border-gray-300 hover:bg-gray-100 text-gray-700"
                  >
                    Not now
                  </Button>
                  <Button
                    onClick={handleAllowLocation}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white"
                  >
                    Detect current location
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Sheet */}
      <CustomerAuthSheet
        isOpen={isAuthSheetOpen}
        onClose={() => setIsAuthSheetOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
