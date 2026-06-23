'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomerAuthSheet } from '../../components/customer-auth-sheet';
import { useCustomerAuth } from '../../contexts/customer-auth-context';
import { useLocation } from '../../contexts/location-context';
import { getPublicOutlets, PublicOutlet } from '../../lib/public-api';
import { calculateDistance, formatDistance } from '../../lib/location-utils';
import { useRouter } from 'next/navigation';
import { Utensils, MapPin, Clock, Star, ShoppingBag, User, LogOut, Loader2, Navigation } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
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
  }, [page]);

  // Calculate and sort by distance when location or outlets change
  useEffect(() => {
    if (location && rawOutlets.length > 0) {
      const outletsWithDistance = rawOutlets.map(outlet => ({
        ...outlet,
        distance: outlet.latitude && outlet.longitude
          ? calculateDistance(location.latitude, location.longitude, outlet.latitude, outlet.longitude)
          : undefined,
      })).filter(outlet => outlet.distance !== undefined); // Filter out outlets without coordinates

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
      const response = await getPublicOutlets(page, 100); // Load more for distance sorting
      if (response.success) {
        setRawOutlets(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotal(response.pagination.total);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 border-b border-orange-200/40 bg-white/60 backdrop-blur-xl shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="bg-gradient-to-br from-orange-600 to-amber-500 p-1.5 rounded-xl shadow-lg shadow-orange-500/30">
                <Utensils className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                FoodHub
              </span>
            </motion.div>

            <div className="flex items-center gap-3">
              {isAuthenticated && customer ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-full">
                    <User className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      {customer.firstName}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="border-orange-400 hover:bg-orange-200/50 text-orange-700"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthSheetOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="border-orange-400 hover:bg-orange-200/50 text-orange-700"
                >
                  <User className="h-4 w-4 mr-1" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white py-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {location ? 'Restaurants Near You' : 'Order from the Best Restaurants'}
          </h1>
          <p className="text-lg text-orange-100 max-w-2xl mx-auto">
            Discover delicious food from {total}+ outlets near you
          </p>
        </div>
      </motion.section>

      {/* Outlets Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-orange-900">Nearby Outlets</h2>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {total} outlets
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {outlets.map((outlet) => (
                <motion.div
                  key={outlet.id}
                  variants={itemVariants}
                  layout
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-orange-200 hover:border-orange-400 group cursor-pointer h-full">
                    <div className="relative h-40 bg-gradient-to-br from-orange-400 to-amber-400">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Utensils className="h-16 w-16 text-white/50" />
                      </div>
                      <Badge className="absolute top-3 right-3 bg-white/90 text-orange-800">
                        {outlet.restaurant.name}
                      </Badge>
                      {outlet.distance !== undefined && (
                        <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                          {formatDistance(outlet.distance)}
                        </Badge>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-bold text-orange-900 mb-2 group-hover:text-orange-600 transition-colors">
                        {outlet.name}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-orange-500" />
                          <span className="line-clamp-1">
                            {outlet.addressLine1}, {outlet.city}
                          </span>
                        </div>

                        {outlet.openingTime && outlet.closingTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span>
                              {outlet.openingTime} - {outlet.closingTime}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-orange-100">
                        <div className="flex items-center gap-1 text-amber-600">
                          <Star className="h-4 w-4 fill-amber-500" />
                          <span className="font-medium">4.5</span>
                        </div>

                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white"
                          onClick={() => {
                            if (isAuthenticated) {
                              router.push(`/customer/menu/${outlet.id}`);
                            } else {
                              setAuthMode('login');
                              setIsAuthSheetOpen(true);
                            }
                          }}
                        >
                          <ShoppingBag className="h-4 w-4 mr-1" />
                          Order Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-orange-400 text-orange-700 hover:bg-orange-100"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-orange-400 text-orange-700 hover:bg-orange-100"
            >
              Next
            </Button>
          </div>
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
                    Allow location
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
