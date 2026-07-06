'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Card } from './ui/card';
import {
  Offer,
  OfferType,
  OfferStatus,
  OfferScope,
  OfferCombinationType,
  UpdateOfferRequest,
  getOfferTypeLabel,
  getOfferStatusLabel,
  getOfferScopeLabel,
} from '../lib/offer-types';
import { updateOffer } from '../lib/offer-api';
import { getMyRestaurants } from '../lib/restaurants-api';
import { getAllOutlets } from '../lib/outlets-api';
import { Restaurant } from '../lib/types';
import { Outlet, OutletListItem } from '../lib/types';

interface EditOfferModalProps {
  open: boolean;
  offer: Offer | null;
  onClose: () => void;
}

export default function EditOfferModal({ open, offer, onClose }: EditOfferModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [step, setStep] = useState(1);

  // Form state - initialized from offer prop
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<OfferType>(OfferType.PERCENTAGE);
  const [percentageValue, setPercentageValue] = useState('');
  const [fixedAmountValue, setFixedAmountValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [status, setStatus] = useState<OfferStatus>(OfferStatus.DRAFT);
  const [scope, setScope] = useState<OfferScope>(OfferScope.PUBLIC);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [outletIds, setOutletIds] = useState<number[]>([]);
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [requireCode, setRequireCode] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [maxUses, setMaxUses] = useState('');
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState('1');
  const [priority, setPriority] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [validDays, setValidDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [validTimeStart, setValidTimeStart] = useState('');
  const [validTimeEnd, setValidTimeEnd] = useState('');
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [combinationType, setCombinationType] = useState<OfferCombinationType>(
    OfferCombinationType.EXCLUSIVE
  );

  // Available data
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [outlets, setOutlets] = useState<OutletListItem[]>([]);

  const [error, setError] = useState('');

  useEffect(() => {
    if (open && offer) {
      // Initialize form from offer data
      setName(offer.name || '');
      setDescription(offer.description || '');
      setCode(offer.code || '');
      setType(offer.type);
      setPercentageValue(offer.percentageValue?.toString() || '');
      setFixedAmountValue(offer.fixedAmountValue?.toString() || '');
      setMaxDiscountAmount(offer.maxDiscountAmount?.toString() || '');
      setStatus(offer.status);
      setScope(offer.scope);
      setRestaurantId(offer.restaurantId?.toString() || '');
      setOutletIds(offer.outletIds || []);
      setMinOrderAmount(offer.minOrderAmount?.toString() || '');
      setRequireCode(offer.requireCode);
      setIsVisible(offer.isVisible);
      setMaxUses(offer.maxUses?.toString() || '');
      setMaxUsesPerCustomer(offer.maxUsesPerCustomer?.toString() || '1');
      setPriority(offer.priority?.toString() || '1');
      setStartDate(offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '');
      setEndDate(offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '');
      setValidDays(offer.validDays || [0, 1, 2, 3, 4, 5, 6]);
      setValidTimeStart(offer.validTimeStart || '');
      setValidTimeEnd(offer.validTimeEnd || '');
      setFirstOrderOnly(offer.firstOrderOnly);
      setCombinationType(offer.combinationType);
      setStep(1);
      setError('');
    }
  }, [open, offer]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (restaurantId) {
      fetchOutletsForRestaurant(+restaurantId);
    }
  }, [restaurantId]);

  const fetchData = async () => {
    try {
      setFetchingData(true);
      const restaurantsRes = await getMyRestaurants();
      setRestaurants(restaurantsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setFetchingData(false);
    }
  };

  const fetchOutletsForRestaurant = async (restId: number) => {
    try {
      const outletsRes = await getAllOutlets(1, 100, restId);
      setOutlets(outletsRes.data || []);
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Offer name is required');
      return false;
    }
    if (!code.trim()) {
      setError('Offer code is required');
      return false;
    }
    if (type === OfferType.PERCENTAGE && !percentageValue) {
      setError('Percentage value is required for percentage offers');
      return false;
    }
    if (type === OfferType.FIXED && !fixedAmountValue) {
      setError('Fixed amount is required for fixed offers');
      return false;
    }
    if (scope === OfferScope.RESTAURANT && !restaurantId) {
      setError('Restaurant is required for restaurant scope');
      return false;
    }
    if (scope === OfferScope.OUTLET && outletIds.length === 0) {
      setError('At least one outlet is required for outlet scope');
      return false;
    }
    if (!startDate || !endDate) {
      setError('Start date and end date are required');
      return false;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!offer || !validateForm()) return;

    try {
      setLoading(true);
      setError('');

      const data: UpdateOfferRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        code: code.trim().toUpperCase(),
        type,
        status,
        scope,
        restaurantId: scope === OfferScope.RESTAURANT ? +restaurantId : undefined,
        percentageValue: type === OfferType.PERCENTAGE ? +percentageValue : undefined,
        fixedAmountValue: type === OfferType.FIXED ? +fixedAmountValue : undefined,
        maxDiscountAmount: maxDiscountAmount ? +maxDiscountAmount : undefined,
        minOrderAmount: minOrderAmount ? +minOrderAmount : undefined,
        requireCode,
        isVisible,
        maxUses: maxUses ? +maxUses : undefined,
        maxUsesPerCustomer: +maxUsesPerCustomer,
        priority: +priority,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        validDays: validDays.length < 7 ? validDays : undefined,
        validTimeStart: validTimeStart || undefined,
        validTimeEnd: validTimeEnd || undefined,
        firstOrderOnly,
        combinationType,
        outletIds: scope === OfferScope.OUTLET ? outletIds : undefined,
      };

      await updateOffer(offer.id, data);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to update offer');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setValidDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleOutlet = (outletId: number) => {
    setOutletIds((prev) =>
      prev.includes(outletId) ? prev.filter((id) => id !== outletId) : [...prev, outletId]
    );
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!offer) {
    return null;
  }

  if (fetchingData) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Offer</DialogTitle>
          <DialogDescription>
            Update offer details for &quot;{offer.name}&quot;
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-8 h-0.5 ${step > s ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-gray-200'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-4">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Offer Name *</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-code">Offer Code *</Label>
                  <Input
                    id="edit-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="border-gray-300 font-mono uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-type">Offer Type *</Label>
                    <Select value={type} onValueChange={(v) => setType(v as OfferType)}>
                      <SelectTrigger id="edit-type" className="border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={OfferType.PERCENTAGE}>
                          {getOfferTypeLabel(OfferType.PERCENTAGE)}
                        </SelectItem>
                        <SelectItem value={OfferType.FIXED}>
                          {getOfferTypeLabel(OfferType.FIXED)}
                        </SelectItem>
                        <SelectItem value={OfferType.FREE_DELIVERY}>
                          {getOfferTypeLabel(OfferType.FREE_DELIVERY)}
                        </SelectItem>
                        <SelectItem value={OfferType.BUY_ONE_GET_ONE}>
                          {getOfferTypeLabel(OfferType.BUY_ONE_GET_ONE)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-status">Status *</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as OfferStatus)}>
                      <SelectTrigger id="edit-status" className="border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={OfferStatus.DRAFT}>
                          {getOfferStatusLabel(OfferStatus.DRAFT)}
                        </SelectItem>
                        <SelectItem value={OfferStatus.ACTIVE}>
                          {getOfferStatusLabel(OfferStatus.ACTIVE)}
                        </SelectItem>
                        <SelectItem value={OfferStatus.PAUSED}>
                          {getOfferStatusLabel(OfferStatus.PAUSED)}
                        </SelectItem>
                        <SelectItem value={OfferStatus.EXPIRED}>
                          {getOfferStatusLabel(OfferStatus.EXPIRED)}
                        </SelectItem>
                        <SelectItem value={OfferStatus.SCHEDULED}>
                          {getOfferStatusLabel(OfferStatus.SCHEDULED)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {type === OfferType.PERCENTAGE && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-percentage">Percentage (%) *</Label>
                      <Input
                        id="edit-percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={percentageValue}
                        onChange={(e) => setPercentageValue(e.target.value)}
                        className="border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-maxDiscount">Max Discount (₹)</Label>
                      <Input
                        id="edit-maxDiscount"
                        type="number"
                        min="0"
                        value={maxDiscountAmount}
                        onChange={(e) => setMaxDiscountAmount(e.target.value)}
                        className="border-gray-300"
                      />
                    </div>
                  </div>
                )}

                {type === OfferType.FIXED && (
                  <div>
                    <Label htmlFor="edit-fixedAmount">Fixed Amount (₹) *</Label>
                    <Input
                      id="edit-fixedAmount"
                      type="number"
                      min="0"
                      value={fixedAmountValue}
                      onChange={(e) => setFixedAmountValue(e.target.value)}
                      className="border-gray-300"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h3 className="text-lg font-semibold mb-4">Scope & Visibility</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-scope">Offer Scope *</Label>
                  <Select value={scope} onValueChange={(v) => setScope(v as OfferScope)}>
                    <SelectTrigger id="edit-scope" className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OfferScope.PUBLIC}>
                        {getOfferScopeLabel(OfferScope.PUBLIC)}
                      </SelectItem>
                      <SelectItem value={OfferScope.RESTAURANT}>
                        {getOfferScopeLabel(OfferScope.RESTAURANT)}
                      </SelectItem>
                      <SelectItem value={OfferScope.OUTLET}>
                        {getOfferScopeLabel(OfferScope.OUTLET)}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scope === OfferScope.RESTAURANT && restaurants.length > 0 && (
                  <div>
                    <Label htmlFor="edit-restaurant">Select Restaurant *</Label>
                    <Select value={restaurantId} onValueChange={setRestaurantId}>
                      <SelectTrigger id="edit-restaurant" className="border-gray-300">
                        <SelectValue placeholder="Select a restaurant" />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurants.map((rest) => (
                          <SelectItem key={rest.id} value={rest.id.toString()}>
                            {rest.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {scope === OfferScope.OUTLET && (
                  <>
                    {restaurants.length > 0 && (
                      <div>
                        <Label htmlFor="edit-restaurant2">First, Select Restaurant *</Label>
                        <Select value={restaurantId} onValueChange={setRestaurantId}>
                          <SelectTrigger id="edit-restaurant2" className="border-gray-300">
                            <SelectValue placeholder="Select a restaurant" />
                          </SelectTrigger>
                          <SelectContent>
                            {restaurants.map((rest) => (
                              <SelectItem key={rest.id} value={rest.id.toString()}>
                                {rest.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {restaurantId && outlets.length > 0 && (
                      <div>
                        <Label>Select Outlets *</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                          {outlets.map((outlet) => (
                            <div
                              key={outlet.id}
                              className={`p-2 border rounded cursor-pointer transition-colors ${
                                outletIds.includes(Number(outlet.id))
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : 'border-gray-300 hover:border-emerald-300'
                              }`}
                              onClick={() => toggleOutlet(Number(outlet.id))}
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox checked={outletIds.includes(Number(outlet.id))} />
                                <span className="text-sm">{outlet.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-requireCode"
                      checked={requireCode}
                      onCheckedChange={(checked) => setRequireCode(checked as boolean)}
                    />
                    <Label htmlFor="edit-requireCode" className="cursor-pointer">
                      Require Code
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-isVisible"
                      checked={isVisible}
                      onCheckedChange={(checked) => setIsVisible(checked as boolean)}
                    />
                    <Label htmlFor="edit-isVisible" className="cursor-pointer">
                      Visible to Customers
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-combination">Combination Type *</Label>
                  <Select
                    value={combinationType}
                    onValueChange={(v) => setCombinationType(v as OfferCombinationType)}
                  >
                    <SelectTrigger id="edit-combination" className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OfferCombinationType.EXCLUSIVE}>Exclusive</SelectItem>
                      <SelectItem value={OfferCombinationType.STACKABLE}>Stackable</SelectItem>
                      <SelectItem value={OfferCombinationType.BEST_DEAL}>Best Deal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h3 className="text-lg font-semibold mb-4">Validity & Restrictions</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-startDate">Start Date *</Label>
                    <Input
                      id="edit-startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-endDate">End Date *</Label>
                    <Input
                      id="edit-endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <Label>Valid Days</Label>
                  <div className="flex gap-2 mt-2">
                    {dayNames.map((day, index) => (
                      <Button
                        key={day}
                        type="button"
                        size="sm"
                        variant={validDays.includes(index) ? 'default' : 'outline'}
                        onClick={() => toggleDay(index)}
                        className={
                          validDays.includes(index)
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white'
                            : 'border-gray-300'
                        }
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-timeStart">Valid Time Start (optional)</Label>
                    <Input
                      id="edit-timeStart"
                      type="time"
                      value={validTimeStart}
                      onChange={(e) => setValidTimeStart(e.target.value)}
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-timeEnd">Valid Time End (optional)</Label>
                    <Input
                      id="edit-timeEnd"
                      type="time"
                      value={validTimeEnd}
                      onChange={(e) => setValidTimeEnd(e.target.value)}
                      className="border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-minOrder">Minimum Order Amount (₹)</Label>
                  <Input
                    id="edit-minOrder"
                    type="number"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="border-gray-300"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-firstOrderOnly"
                    checked={firstOrderOnly}
                    onCheckedChange={(checked) => setFirstOrderOnly(checked as boolean)}
                  />
                  <Label htmlFor="edit-firstOrderOnly" className="cursor-pointer">
                    First Order Only
                  </Label>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h3 className="text-lg font-semibold mb-4">Usage Limits</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-maxUses">Max Total Uses</Label>
                    <Input
                      id="edit-maxUses"
                      type="number"
                      min="1"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="Leave empty for unlimited"
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-maxUsesCustomer">Max Uses Per Customer *</Label>
                    <Input
                      id="edit-maxUsesCustomer"
                      type="number"
                      min="1"
                      value={maxUsesPerCustomer}
                      onChange={(e) => setMaxUsesPerCustomer(e.target.value)}
                      className="border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Input
                    id="edit-priority"
                    type="number"
                    min="1"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="border-gray-300"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded">
            {error}
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-gray-300"
          >
            Cancel
          </Button>
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((prev) => prev - 1)}
              disabled={loading}
              className="border-gray-300"
            >
              Previous
            </Button>
          )}
          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep((prev) => prev + 1)}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
            >
              {loading ? 'Updating...' : 'Update Offer'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
