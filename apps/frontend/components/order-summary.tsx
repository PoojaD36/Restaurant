'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, MapPin, Clock, Check, Loader2, Plus, Minus } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CartState } from '../lib/cart-types';

interface OrderSummaryProps {
  cart: CartState;
  isPlacingOrder?: boolean;
  canPlaceOrder?: boolean;
  onPlaceOrder?: () => void;
  selectedAddressLabel?: string;
  onUpdateQuantity?: (tempId: string, quantity: number) => void;
  onRemoveItem?: (tempId: string) => void;
}

const DELIVERY_FEE = 30;

export function OrderSummary({
  cart,
  isPlacingOrder = false,
  canPlaceOrder = false,
  onPlaceOrder,
  selectedAddressLabel,
  onUpdateQuantity,
  onRemoveItem,
}: OrderSummaryProps) {
  const subtotal = cart.subtotal;
  const deliveryFee = DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  return (
    <Card className="sticky top-24 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-emerald-900">Order Summary</h2>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Outlet Info */}
        {cart.outletName && (
          <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{cart.outletName}</p>
              {cart.outletAddress && (
                <p className="text-sm text-gray-600 truncate">{cart.outletAddress}</p>
              )}
            </div>
          </div>
        )}

        {/* Selected Address */}
        {selectedAddressLabel && (
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-700">
              Delivering to <span className="font-semibold text-emerald-900">{selectedAddressLabel}</span>
            </span>
          </div>
        )}

        {/* Cart Items */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {cart.items.map((item, index) => (
            <motion.div
              key={item.tempId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-start gap-3"
            >
              {/* Item Image */}
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-200 to-teal-200 flex-shrink-0 flex items-center justify-center">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <ShoppingBag className="h-5 w-5 text-emerald-400" />
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                {!isPlacingOrder && onUpdateQuantity ? (
                  // Show quantity controls
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateQuantity(item.tempId, item.quantity - 1)}
                        className="h-7 w-7 p-0 rounded-full border-orange-300 text-emerald-600 hover:bg-emerald-100"
                        disabled={isPlacingOrder}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-semibold text-emerald-900 w-6 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateQuantity(item.tempId, item.quantity + 1)}
                        className="h-7 w-7 p-0 rounded-full border-orange-300 text-emerald-600 hover:bg-emerald-100"
                        disabled={isPlacingOrder}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold text-emerald-900 ml-auto">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  // Show static quantity badge
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-emerald-100 text-orange-800 px-2 py-0.5 rounded-full">
                      Qty: {item.quantity}
                    </span>
                    <span className="text-sm font-semibold text-emerald-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Modifiers */}
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {item.modifiers.map((modifier) => (
                      <div key={modifier.modifierGroupId} className="text-xs text-gray-600">
                        <span className="font-medium">{modifier.modifierGroupName}:</span>
                        {modifier.selectedOptions.map((opt, i) => (
                          <span key={opt.id}>
                            {i > 0 && ', '}
                            {opt.name}
                            {opt.priceAdjustment > 0 && ` (+₹${opt.priceAdjustment})`}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery Fee</span>
            <span className="font-medium text-gray-900">₹{deliveryFee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span className="text-emerald-900">Total</span>
            <span className="text-emerald-900">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Estimated Delivery Time */}
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-emerald-50 p-3 rounded-lg">
          <Clock className="h-4 w-4 text-emerald-600" />
          <span>Estimated delivery: <span className="font-semibold text-emerald-900">30-45 mins</span></span>
        </div>

        {/* Place Order Button */}
        <Button
          onClick={onPlaceOrder}
          disabled={!canPlaceOrder || isPlacingOrder}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50"
          size="lg"
        >
          {isPlacingOrder ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Place Order • ₹{total.toFixed(2)}
            </>
          )}
        </Button>

        {!canPlaceOrder && (
          <p className="text-center text-sm text-gray-500">
            Select an address to place your order
          </p>
        )}
      </CardContent>
    </Card>
  );
}
