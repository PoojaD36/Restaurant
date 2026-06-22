'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomerAuthSheet } from '../../components/customer-auth-sheet';
import { useCustomerAuth } from '../../contexts/customer-auth-context';
import { getPublicOutlets, PublicOutlet } from '../../lib/public-api';
import { Utensils, MapPin, Clock, Star, ShoppingBag, User, LogOut, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import Image from 'next/image';

export default function CustomerPage() {
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const [outlets, setOutlets] = useState<PublicOutlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Show auth sheet if not authenticated
    if (!isAuthenticated) {
      setTimeout(() => {
        setIsAuthSheetOpen(true);
      }, 1500);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadOutlets();
  }, [page]);

  const loadOutlets = async () => {
    try {
      setIsLoading(true);
      const response = await getPublicOutlets(page, 20);
      if (response.success) {
        setOutlets(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotal(response.pagination.total);
      }
    } catch (error) {
      console.error('Failed to load outlets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthSheetOpen(false);
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
            Order from the Best Restaurants
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
                              // Navigate to menu
                              console.log('Navigate to menu for outlet:', outlet.id);
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

      {/* Auth Sheet */}
      <CustomerAuthSheet
        isOpen={isAuthSheetOpen}
        onClose={() => setIsAuthSheetOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
