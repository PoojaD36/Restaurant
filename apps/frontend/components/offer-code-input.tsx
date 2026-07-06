'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, Check, Loader2, ChevronDown } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  applyOffer,
  previewOfferDiscount,
  getAvailableOffers,
} from '../lib/offer-api';
import { useCustomerAuth } from '../contexts/customer-auth-context';
import { useCart } from '../contexts/cart-context';
import { DiscountResult, Offer } from '../lib/offer-types';

interface OfferCodeInputProps {
  outletId?: number;
  onOfferApplied?: (offer: any, discount: DiscountResult) => void;
  onOfferRemoved?: () => void;
  className?: string;
  compact?: boolean;
}

export default function OfferCodeInput({
  outletId,
  onOfferApplied,
  onOfferRemoved,
  className = '',
  compact = false,
}: OfferCodeInputProps) {
  const { customer } = useCustomerAuth();
  const { cart } = useCart();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [appliedOffer, setAppliedOffer] = useState<any>(null);
  const [discount, setDiscount] = useState<DiscountResult | null>(null);
  const [showAvailableOffers, setShowAvailableOffers] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // Check if offer is already applied in cart
  useEffect(() => {
    if (cart?.appliedOffer) {
      setAppliedOffer(cart.appliedOffer);
      setSuccess(true);
    }
  }, [cart]);

  const fetchAvailableOffers = async () => {
    if (!outletId) return;

    try {
      setLoadingOffers(true);
      const response = await getAvailableOffers(outletId);
      if (response.success && response.data) {
        setAvailableOffers(response.data);
      }
    } catch (error) {
      console.error('Error fetching available offers:', error);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleApplyOffer = async () => {
    if (!code.trim() || !outletId || !cart) {
      setError('Please enter an offer code');
      return;
    }

    if (!customer) {
      setError('Please login to apply offers');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Prepare cart items for API
      const items = cart.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const response = await applyOffer({
        code: code.trim().toUpperCase(),
        outletId,
        cartTotal: cart.subtotal,
        items,
      });

      if (response.success && response.data) {
        setAppliedOffer(response.data.offer);
        setDiscount(response.data.discount);
        setSuccess(true);
        setError('');

        // Notify parent component
        if (onOfferApplied) {
          onOfferApplied(response.data.offer, response.data.discount);
        }

        // Update cart with offer info (parent will handle actual cart update)
        setCode('');
      } else {
        setError(response.message || 'Invalid offer code');
        setSuccess(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to apply offer');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewOffer = async (offerCode: string) => {
    if (!outletId || !cart) return;

    try {
      const items = cart.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const response = await previewOfferDiscount({
        code: offerCode,
        outletId,
        cartTotal: cart.subtotal,
        items,
      });

      if (response.success && response.data) {
        return response.data.discount;
      }
    } catch (err) {
      console.error('Error previewing offer:', err);
    }
    return null;
  };

  const handleRemoveOffer = () => {
    setAppliedOffer(null);
    setDiscount(null);
    setSuccess(false);
    setError('');

    if (onOfferRemoved) {
      onOfferRemoved();
    }
  };

  const handleToggleAvailableOffers = () => {
    if (!showAvailableOffers) {
      fetchAvailableOffers();
    }
    setShowAvailableOffers(!showAvailableOffers);
  };

  const handleQuickApply = async (offerCode: string) => {
    setCode(offerCode);
    // Apply immediately
    if (customer) {
      setCode(offerCode);
      setTimeout(() => handleApplyOffer(), 100);
    } else {
      setCode(offerCode);
    }
  };

  if (compact && appliedOffer) {
    return (
      <div className={`flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2 ${className}`}>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">{appliedOffer.code}</span>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            -₹{appliedOffer.discountAmount || discount?.discountAmount || 0}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRemoveOffer}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Applied Offer Display */}
      {appliedOffer && success && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-500 p-1.5 rounded-full">
                <Check className="h-3 w-3 text-white" />
              </div>
              <div>
                <div className="font-medium text-emerald-900">{appliedOffer.name}</div>
                <div className="text-sm text-emerald-700">
                  Code: <span className="font-mono">{appliedOffer.code}</span>
                </div>
                {discount && (
                  <div className="text-sm font-semibold text-emerald-600 mt-1">
                    You save ₹{discount.discountAmount}!
                  </div>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRemoveOffer}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Offer Code Input */}
      {!appliedOffer && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Enter offer code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyOffer()}
                className="pl-10 border-gray-300"
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleApplyOffer}
              disabled={loading || !code.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Available Offers Toggle */}
          {outletId && (
            <div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleToggleAvailableOffers}
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 text-sm"
              >
                <ChevronDown
                  className={`h-4 w-4 mr-1 transition-transform ${showAvailableOffers ? 'rotate-180' : ''}`}
                />
                View Available Offers
              </Button>

              <AnimatePresence>
                {showAvailableOffers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-gray-200 rounded-lg mt-2 overflow-hidden"
                  >
                    {loadingOffers ? (
                      <div className="p-4 text-center text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </div>
                    ) : availableOffers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No offers available for this outlet
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {availableOffers.map((offer) => (
                          <div
                            key={offer.id}
                            className="p-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{offer.name}</div>
                                <div className="text-sm text-gray-600">
                                  Code: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{offer.code}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {offer.type === 'PERCENTAGE' && `${offer.percentageValue}% off`}
                                  {offer.type === 'FIXED' && `₹${offer.fixedAmountValue} off`}
                                  {offer.type === 'FREE_DELIVERY' && 'Free delivery'}
                                  {offer.type === 'BUY_ONE_GET_ONE' && 'Buy one get one'}
                                  {offer.maxDiscountAmount && ` (Max ₹${offer.maxDiscountAmount})`}
                                </div>
                                {offer.minOrderAmount && (
                                  <div className="text-xs text-gray-500">
                                    Min order: ₹{offer.minOrderAmount}
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleQuickApply(offer.code)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                              >
                                Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
