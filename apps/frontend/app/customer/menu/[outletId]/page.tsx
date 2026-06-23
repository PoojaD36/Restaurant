'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCart } from '../../../../contexts/cart-context';
import { getPublicMenuByOutlet, getPublicOutletById } from '../../../../lib/public-api';
import { PublicMenu, MenuItem as MenuItemType } from '../../../../lib/menu-types';
import { Utensils, MapPin, Clock, ArrowLeft, Loader2, Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Card } from '../../../../components/ui/card';

export default function MenuPage() {
  const params = useParams();
  const router = useRouter();
  const outletId = params.outletId as string;
  const { cart, addToCart, updateQuantity, setOutletInfo } = useCart();

  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [outlet, setOutlet] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);
  const [modifierSelections, setModifierSelections] = useState<Record<number, number[]>>({});

  useEffect(() => {
    loadMenu();
  }, [outletId]);

  const loadMenu = async () => {
    try {
      setIsLoading(true);

      // Load menu and outlet info in parallel
      const [menuResponse, outletResponse] = await Promise.all([
        getPublicMenuByOutlet(outletId),
        getPublicOutletById(outletId),
      ]);

      if (menuResponse.success) {
        setMenu(menuResponse.data);
        // Set first category as active
        if (menuResponse.data.categories.length > 0) {
          setActiveCategory(menuResponse.data.categories[0].id.toString());
        }
      }

      if (outletResponse.success) {
        setOutlet(outletResponse.data);
        // Set outlet info for cart
        setOutletInfo(
          parseInt(outletId),
          outletResponse.data.name,
          `${outletResponse.data.addressLine1}, ${outletResponse.data.city}`
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItemType) => {
    if (!cart || cart.outletId === 0) {
      alert('Please try again');
      return;
    }

    // Build modifier selections
    const modifiers = Object.entries(modifierSelections)
      .filter(([_, options]) => options.length > 0)
      .map(([groupId, optionIds]) => {
        const group = item.modifiers?.find(m => m.id === parseInt(groupId));
        if (!group) return null;

        const selectedOptions = group.options.filter(opt => optionIds.includes(opt.id));
        return {
          modifierGroupId: group.id,
          modifierGroupName: group.name,
          type: group.type,
          selectedOptions,
        };
      })
      .filter(Boolean);

    addToCart({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
      modifiers: modifiers as any,
    });

    // Reset state
    setSelectedItem(null);
    setModifierSelections({});
  };

  const handleModifierSelection = (groupId: number, optionId: number, type: 'SINGLE' | 'MULTIPLE') => {
    setModifierSelections(prev => {
      if (type === 'SINGLE') {
        // For single selection, replace with new selection
        return { ...prev, [groupId]: [optionId] };
      } else {
        // For multiple selection, toggle
        const current = prev[groupId] || [];
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter(id => id !== optionId) };
        } else {
          return { ...prev, [groupId]: [...current, optionId] };
        }
      }
    });
  };

  const isModifierValid = (item: MenuItemType) => {
    if (!item.modifiers || item.modifiers.length === 0) return true;

    for (const modifier of item.modifiers) {
      if (modifier.required) {
        const selected = modifierSelections[modifier.id] || [];
        if (selected.length === 0) return false;
        if (modifier.minSelect > 0 && selected.length < modifier.minSelect) return false;
      }
      const selected = modifierSelections[modifier.id] || [];
      if (selected.length > modifier.maxSelect) return false;
    }

    return true;
  };

  const calculateItemPrice = (item: MenuItemType) => {
    let price = item.price;

    Object.entries(modifierSelections).forEach(([groupId, optionIds]) => {
      const group = item.modifiers?.find(m => m.id === parseInt(groupId));
      if (group) {
        optionIds.forEach(optionId => {
          const option = group.options.find(o => o.id === optionId);
          if (option) {
            price += option.priceAdjustment;
          }
        });
      }
    });

    return price;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Menu not found'}</p>
          <Button onClick={() => router.push('/customer')} className="w-full">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const activeCategoryData = menu.categories.find(c => c.id.toString() === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 border-b border-orange-200/40 bg-white/60 backdrop-blur-xl shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/customer')}
              className="hover:bg-orange-100"
            >
              <ArrowLeft className="h-5 w-5 text-orange-600" />
            </Button>

            <div className="flex-1">
              <h1 className="text-lg font-bold text-orange-900">{outlet?.name}</h1>
              <p className="text-sm text-gray-600">{menu.name}</p>
            </div>

            {cart && cart.items.length > 0 && (
              <Button
                onClick={() => router.push('/customer/checkout')}
                className="relative bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Cart
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Category Navigation */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-sm border-b border-orange-200/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {menu.categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id.toString())}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeCategory === category.id.toString()
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {activeCategoryData?.items
            .filter(item => item.available)
            .map(item => (
              <Card key={item.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex gap-4">
                  {/* Item Image */}
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-orange-200 to-amber-200 flex-shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Utensils className="h-8 w-8 text-orange-400" />
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-orange-900">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Dietary Badges */}
                    <div className="flex gap-2 mt-2">
                      {item.isVegetarian && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Veg
                        </Badge>
                      )}
                      {item.isSpicy && (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          🌶️ Spicy
                        </Badge>
                      )}
                    </div>

                    {/* Modifiers */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="mt-2 text-sm text-orange-600">
                        + Customizable
                      </div>
                    )}
                  </div>

                  {/* Add to Cart */}
                  <div className="flex flex-col items-end justify-between">
                    <span className="text-lg font-bold text-orange-900">₹{item.price}</span>
                    <Button
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                      className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
        </motion.div>

        {activeCategoryData?.items.filter(item => item.available).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No items available in this category
          </div>
        )}
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setSelectedItem(null);
            setModifierSelections({});
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 100 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-orange-900">{selectedItem.name}</h3>
                  {selectedItem.description && (
                    <p className="text-gray-600 mt-1">{selectedItem.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedItem(null);
                    setModifierSelections({});
                  }}
                >
                  ✕
                </Button>
              </div>

              {/* Modifiers */}
              {selectedItem.modifiers?.map(modifier => (
                <div key={modifier.id} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {modifier.name}
                      {modifier.required && <span className="text-red-500 ml-1">*</span>}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {modifier.type === 'SINGLE' ? 'Select 1' : `Select ${modifier.minSelect}-${modifier.maxSelect}`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {modifier.options.map(option => (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          modifierSelections[modifier.id]?.includes(option.id)
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type={modifier.type === 'SINGLE' ? 'radio' : 'checkbox'}
                            name={`modifier-${modifier.id}`}
                            checked={modifierSelections[modifier.id]?.includes(option.id) || false}
                            onChange={() => handleModifierSelection(modifier.id, option.id, modifier.type)}
                            className="w-4 h-4 text-orange-600"
                          />
                          <span className="font-medium">{option.name}</span>
                        </div>
                        {option.priceAdjustment > 0 && (
                          <span className="text-orange-600 font-semibold">+₹{option.priceAdjustment}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Add to Cart Button */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div>
                  <span className="text-2xl font-bold text-orange-900">₹{calculateItemPrice(selectedItem)}</span>
                </div>
                <Button
                  onClick={() => handleAddToCart(selectedItem)}
                  disabled={!isModifierValid(selectedItem)}
                  className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 disabled:opacity-50"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
