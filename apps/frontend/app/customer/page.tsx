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
  Navigation, Filter, ChevronDown, ArrowRight, ShoppingBag, Package
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { CustomerNotificationBell } from '../../components/customer-notification-bell';

interface OutletWithDistance extends PublicOutlet {
  distance?: number;
}

// Cuisine types for explore section
const CUISINE_TYPES = [
  'Beverages', 'Burger', 'Chinese', 'Coffee', 'Healthy Food', 'Momos',
  'North Indian', 'Pasta', 'Pizza', 'Sandwich', 'Shake', 'South Indian'
];

// Restaurant types
const RESTAURANT_TYPES = ['Dhabas', 'Quick Bites', 'Sweet Shops', 'Casual Dining', 'Fine Dining'];

// Filter options
const FILTER_OPTIONS = [
  { id: 'rating', label: 'Rating: 4.0+' },
  { id: 'offers', label: 'Offers' },
  { id: 'open', label: 'Open Now' },
  { id: 'delivery', label: 'Free Delivery' },
];

export default function CustomerPage() {
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const { location, permissionStatus, requestLocation } = useLocation();
  const router = useRouter();

  const [outlets, setOutlets] = useState<OutletWithDistance[]>([]);
  const [rawOutlets, setRawOutlets] = useState<PublicOutlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Tab state (Dining Out / Delivery)
  const [activeTab, setActiveTab] = useState<'dining' | 'delivery'>('dining');

  // Filters state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

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

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Zomato Style */}
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
            <div className="flex items-center gap-4">
              {/* Location Detection */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => requestLocation()}
                className="text-gray-700 hover:text-orange-600 gap-2"
              >
                <Navigation className="h-4 w-4" />
                {location ? (
                  <span className="hidden sm:inline text-sm">
                    Location detected
                  </span>
                ) : (
                  <span className="hidden sm:inline text-sm">Detect location</span>
                )}
              </Button>

              {/* Auth */}
              {isAuthenticated && customer ? (
                <div className="flex items-center gap-2">
                  {/* My Profile Button - Desktop */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/customer/profile')}
                    className="text-gray-700 hover:text-orange-600 gap-2 hidden sm:flex"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm">My Profile</span>
                  </Button>

                  {/* My Orders Button - Desktop */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/customer/orders')}
                    className="text-gray-700 hover:text-orange-600 gap-2 hidden sm:flex"
                  >
                    <Package className="h-4 w-4" />
                    <span className="text-sm">My Orders</span>
                  </Button>

                  {/* Notification Bell */}
                  <CustomerNotificationBell />

                  <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {customer.firstName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-orange-600"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAuthMode('login');
                      setIsAuthSheetOpen(true);
                    }}
                    className="text-gray-700 hover:text-orange-600"
                  >
                    Log in
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setAuthMode('register');
                      setIsAuthSheetOpen(true);
                    }}
                    className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white"
                  >
                    Sign up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto">
            <span className="hover:text-orange-600 cursor-pointer">Home</span>
            <span>/</span>
            <span className="hover:text-orange-600 cursor-pointer">India</span>
            <span>/</span>
            <span className="hover:text-orange-600 cursor-pointer">
              Your City
            </span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Restaurants</span>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('dining')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'dining'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Dining Out
            </button>
            <button
              onClick={() => setActiveTab('delivery')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'delivery'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Delivery
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trending dining out restaurants in Your City
          </h1>
          <p className="text-gray-600">
            Check out the list of all the best dining restaurants near you. View Menus, Pictures, Ratings & Reviews.
          </p>
        </div>

        {/* Filters Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  selectedFilters.includes(filter.id)
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Restaurant List - Grid Layout for PC, Horizontal for Mobile */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : (
          <>
            {/* Desktop Grid Layout (3-4 cards per row) */}
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
                      onClick={() => {
                        if (isAuthenticated) {
                          router.push(`/customer/menu/${outlet.id}`);
                        } else {
                          setAuthMode('login');
                          setIsAuthSheetOpen(true);
                        }
                      }}
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
                        {/* Pro Badge */}
                        {Math.random() > 0.7 && (
                          <Badge className="absolute bottom-3 left-3 bg-blue-600 text-white border-0">
                            Pro
                          </Badge>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-4 flex flex-col">
                        {/* Restaurant Name with Rating */}
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-bold text-gray-900 truncate flex-1">
                            {outlet.name}
                          </h3>
                          <Badge className="bg-white text-green-700 border border-green-600 shrink-0 ml-2">
                            <span className="font-bold text-xs">4.6</span>
                          </Badge>
                        </div>

                        {/* Cuisines */}
                        <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                          <span className="truncate">
                            North Indian, Chinese, Fast Food, Beverages
                          </span>
                        </div>

                        {/* Location & Distance */}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{outlet.city}</span>
                          {outlet.distance !== undefined && (
                            <span className="text-gray-400 shrink-0">• {formatDistance(outlet.distance)}</span>
                          )}
                        </div>

                        {/* Cost */}
                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">₹{(Math.random() * 300 + 200).toFixed(0)}</span>
                            <span className="text-gray-500"> for two</span>
                          </div>

                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isAuthenticated) {
                                router.push(`/customer/menu/${outlet.id}`);
                              } else {
                                setAuthMode('login');
                                setIsAuthSheetOpen(true);
                              }
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
                      onClick={() => {
                        if (isAuthenticated) {
                          router.push(`/customer/menu/${outlet.id}`);
                        } else {
                          setAuthMode('login');
                          setIsAuthSheetOpen(true);
                        }
                      }}
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
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                              {outlet.name}
                            </h3>
                            <Badge className="bg-white text-green-700 border border-green-600 shrink-0">
                              <span className="font-bold text-xs">4.6</span>
                            </Badge>
                          </div>

                          {/* Cuisines */}
                          <div className="text-xs text-gray-600 mb-1 line-clamp-1">
                            North Indian, Chinese, Fast Food
                          </div>

                          {/* Location & Distance */}
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{outlet.city}</span>
                            {outlet.distance !== undefined && (
                              <span className="text-gray-400 shrink-0">• {formatDistance(outlet.distance)}</span>
                            )}
                          </div>

                          {/* Cost & Button */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">₹{(Math.random() * 300 + 200).toFixed(0)}</span>
                              <span className="text-gray-500"> for two</span>
                            </div>

                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white text-xs px-3 py-1 h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAuthenticated) {
                                  router.push(`/customer/menu/${outlet.id}`);
                                } else {
                                  setAuthMode('login');
                                  setIsAuthSheetOpen(true);
                                }
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
          </>
        )}

        {/* End of Results */}
        {!isLoading && outlets.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-500">End of search results</p>
          </div>
        )}
      </main>

      {/* Explore Options Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Explore options near me
        </h2>

        {/* Popular Cuisines */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Popular cuisines near me
          </h3>
          <div className="flex flex-wrap gap-2">
            {CUISINE_TYPES.map((cuisine) => (
              <button
                key={cuisine}
                className="px-4 py-2 bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 rounded-lg text-sm transition-colors"
              >
                {cuisine} near me
              </button>
            ))}
          </div>
        </div>

        {/* Popular Restaurant Types */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Popular restaurant types near me
          </h3>
          <div className="flex flex-wrap gap-2">
            {RESTAURANT_TYPES.map((type) => (
              <button
                key={type}
                className="px-4 py-2 bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 rounded-lg text-sm transition-colors"
              >
                {type} near me
              </button>
            ))}
          </div>
        </div>

        {/* CTA for more */}
        <Button
          variant="outline"
          className="border-orange-400 text-orange-700 hover:bg-orange-50"
        >
          View all restaurants
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </section>

      {/* Footer - Zomato Style */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">About FoodHub</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-600">Who We Are</a></li>
                <li><a href="#" className="hover:text-orange-600">Blog</a></li>
                <li><a href="#" className="hover:text-orange-600">Work With Us</a></li>
                <li><a href="#" className="hover:text-orange-600">Contact Us</a></li>
              </ul>
            </div>

            {/* For Restaurants */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">For Restaurants</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-600">Partner With Us</a></li>
                <li><a href="#" className="hover:text-orange-600">Apps For You</a></li>
              </ul>
            </div>

            {/* Learn More */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Learn More</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-600">Privacy</a></li>
                <li><a href="#" className="hover:text-orange-600">Security</a></li>
                <li><a href="#" className="hover:text-orange-600">Terms</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Social Links</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-orange-600">Instagram</a></li>
                <li><a href="#" className="hover:text-orange-600">Twitter</a></li>
                <li><a href="#" className="hover:text-orange-600">Facebook</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© 2026 FoodHub. All rights reserved.</p>
          </div>
        </div>
      </footer>

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
