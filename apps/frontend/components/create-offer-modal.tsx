'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Badge } from './ui/badge';
import {
  OfferType,
  OfferStatus,
  OfferScope,
  OfferCombinationType,
  CreateOfferRequest,
  getOfferTypeLabel,
  getOfferStatusLabel,
  getOfferScopeLabel,
} from '../lib/offer-types';
import { createOffer } from '../lib/offer-api';
import { getMyRestaurants } from '../lib/restaurants-api';
import { getAllOutlets } from '../lib/outlets-api';
import { getAllMenus } from '../lib/menus-api';
import { Restaurant } from '../lib/types';
import { OutletListItem } from '../lib/types';

interface CreateOfferModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateOfferModal({ open, onClose }: CreateOfferModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [step, setStep] = useState(1);

  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');

  // Offer Type & Value
  const [type, setType] = useState<OfferType>(OfferType.PERCENTAGE);
  const [percentageValue, setPercentageValue] = useState('');
  const [fixedAmountValue, setFixedAmountValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');

  // Status & Scope
  const [status, setStatus] = useState<OfferStatus>(OfferStatus.DRAFT);
  const [scope, setScope] = useState<OfferScope>(OfferScope.PUBLIC);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [outletIds, setOutletIds] = useState<number[]>([]);

  // Requirements
  const [minOrderAmount, setMinOrderAmount] = useState('');

  // Visibility
  const [requireCode, setRequireCode] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  // Usage Limits
  const [maxUses, setMaxUses] = useState('');
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState('1');
  const [priority, setPriority] = useState('1');

  // Validity
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [validDays, setValidDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [validTimeStart, setValidTimeStart] = useState('');
  const [validTimeEnd, setValidTimeEnd] = useState('');

  // Customer Rules
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);

  // Combination
  const [combinationType, setCombinationType] = useState<OfferCombinationType>(OfferCombinationType.EXCLUSIVE);

  // Category/Item restrictions
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [menuItemIds, setMenuItemIds] = useState<number[]>([]);

  // Available data
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [outlets, setOutlets] = useState<OutletListItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

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
      const [restaurantsRes, menusRes] = await Promise.all([
        getMyRestaurants(),
        getAllMenus(),
      ]);

      setRestaurants(restaurantsRes.data || []);
      // Extract categories from menus
      const allCategories = menusRes.data?.flatMap((menu: any) =>
        menu.categories?.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
        })) || []
      ) || [];
      setCategories(allCategories);
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
      setOutletIds([]); // Reset outlet selection
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  const generateCode = () => {
    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8);
    setCode(code || 'OFFER');
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
    if (!maxUsesPerCustomer) {
      setError('Max uses per customer is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      const data: CreateOfferRequest = {
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
        categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        menuItemIds: menuItemIds.length > 0 ? menuItemIds : undefined,
      };

      await createOffer(data);
      onClose();
      resetForm();
    } catch (error: any) {
      setError(error.message || 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCode('');
    setType(OfferType.PERCENTAGE);
    setPercentageValue('');
    setFixedAmountValue('');
    setMaxDiscountAmount('');
    setStatus(OfferStatus.DRAFT);
    setScope(OfferScope.PUBLIC);
    setRestaurantId('');
    setOutletIds([]);
    setMinOrderAmount('');
    setRequireCode(true);
    setIsVisible(true);
    setMaxUses('');
    setMaxUsesPerCustomer('1');
    setPriority('1');
    setStartDate('');
    setEndDate('');
    setValidDays([0, 1, 2, 3, 4, 5, 6]);
    setValidTimeStart('');
    setValidTimeEnd('');
    setFirstOrderOnly(false);
    setCombinationType(OfferCombinationType.EXCLUSIVE);
    setCategoryIds([]);
    setMenuItemIds([]);
    setError('');
    setStep(1);
    setShowPreview(false);
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
          <DialogTitle>Create New Offer</DialogTitle>
          <DialogDescription>
            Configure your discount offer with the details below
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

        {/* Step Content */}
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
                  <Label htmlFor="name">Offer Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Summer Special 20% Off"
                    className="border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the offer"
                    className="border-gray-300"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="code">Offer Code *</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={generateCode}
                      className="h-6 text-xs"
                    >
                      Auto-generate
                    </Button>
                  </div>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SUMMER20"
                    className="border-gray-300 font-mono uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Offer Type *</Label>
                    <Select value={type} onValueChange={(v) => setType(v as OfferType)}>
                      <SelectTrigger id="type" className="border-gray-300">
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
                    <Label htmlFor="status">Initial Status *</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as OfferStatus)}>
                      <SelectTrigger id="status" className="border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={OfferStatus.DRAFT}>
                          {getOfferStatusLabel(OfferStatus.DRAFT)}
                        </SelectItem>
                        <SelectItem value={OfferStatus.ACTIVE}>
                          {getOfferStatusLabel(OfferStatus.ACTIVE)}
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
                      <Label htmlFor="percentageValue">Percentage (%) *</Label>
                      <Input
                        id="percentageValue"
                        type="number"
                        min="0"
                        max="100"
                        value={percentageValue}
                        onChange={(e) => setPercentageValue(e.target.value)}
                        placeholder="e.g., 20"
                        className="border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxDiscount">Max Discount (₹)</Label>
                      <Input
                        id="maxDiscount"
                        type="number"
                        min="0"
                        value={maxDiscountAmount}
                        onChange={(e) => setMaxDiscountAmount(e.target.value)}
                        placeholder="Optional cap"
                        className="border-gray-300"
                      />
                    </div>
                  </div>
                )}

                {type === OfferType.FIXED && (
                  <div>
                    <Label htmlFor="fixedAmount">Fixed Amount (₹) *</Label>
                    <Input
                      id="fixedAmount"
                      type="number"
                      min="0"
                      value={fixedAmountValue}
                      onChange={(e) => setFixedAmountValue(e.target.value)}
                      placeholder="e.g., 100"
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
                  <Label htmlFor="scope">Offer Scope *</Label>
                  <Select value={scope} onValueChange={(v) => setScope(v as OfferScope)}>
                    <SelectTrigger id="scope" className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OfferScope.PUBLIC}>
                        {getOfferScopeLabel(OfferScope.PUBLIC)} - Available to all customers
                      </SelectItem>
                      <SelectItem value={OfferScope.RESTAURANT}>
                        {getOfferScopeLabel(OfferScope.RESTAURANT)} - Specific restaurant only
                      </SelectItem>
                      <SelectItem value={OfferScope.OUTLET}>
                        {getOfferScopeLabel(OfferScope.OUTLET)} - Specific outlets only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scope === OfferScope.RESTAURANT && restaurants.length > 0 && (
                  <div>
                    <Label htmlFor="restaurant">Select Restaurant *</Label>
                    <Select value={restaurantId} onValueChange={setRestaurantId}>
                      <SelectTrigger id="restaurant" className="border-gray-300">
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
                        <Label htmlFor="restaurant2">First, Select Restaurant *</Label>
                        <Select value={restaurantId} onValueChange={setRestaurantId}>
                          <SelectTrigger id="restaurant2" className="border-gray-300">
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
                      id="requireCode"
                      checked={requireCode}
                      onCheckedChange={(checked) => setRequireCode(checked as boolean)}
                    />
                    <Label htmlFor="requireCode" className="cursor-pointer">
                      Require Code
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isVisible"
                      checked={isVisible}
                      onCheckedChange={(checked) => setIsVisible(checked as boolean)}
                    />
                    <Label htmlFor="isVisible" className="cursor-pointer">
                      Visible to Customers
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="combination">Combination Type *</Label>
                  <Select
                    value={combinationType}
                    onValueChange={(v) => setCombinationType(v as OfferCombinationType)}
                  >
                    <SelectTrigger id="combination" className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OfferCombinationType.EXCLUSIVE}>
                        Exclusive - Cannot combine with other offers
                      </SelectItem>
                      <SelectItem value={OfferCombinationType.STACKABLE}>
                        Stackable - Can combine with other offers
                      </SelectItem>
                      <SelectItem value={OfferCombinationType.BEST_DEAL}>
                        Best Deal - System picks the highest discount
                      </SelectItem>
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
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <Label>Valid Days (leave all selected for every day)</Label>
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
                    <Label htmlFor="timeStart">Valid Time Start (optional)</Label>
                    <Input
                      id="timeStart"
                      type="time"
                      value={validTimeStart}
                      onChange={(e) => setValidTimeStart(e.target.value)}
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeEnd">Valid Time End (optional)</Label>
                    <Input
                      id="timeEnd"
                      type="time"
                      value={validTimeEnd}
                      onChange={(e) => setValidTimeEnd(e.target.value)}
                      className="border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="minOrder">Minimum Order Amount (₹)</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    placeholder="Optional minimum order value"
                    className="border-gray-300"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="firstOrderOnly"
                    checked={firstOrderOnly}
                    onCheckedChange={(checked) => setFirstOrderOnly(checked as boolean)}
                  />
                  <Label htmlFor="firstOrderOnly" className="cursor-pointer">
                    First Order Only - Only for new customers
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
                    <Label htmlFor="maxUses">Max Total Uses</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min="1"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="Leave empty for unlimited"
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxUsesCustomer">Max Uses Per Customer *</Label>
                    <Input
                      id="maxUsesCustomer"
                      type="number"
                      min="1"
                      value={maxUsesPerCustomer}
                      onChange={(e) => setMaxUsesPerCustomer(e.target.value)}
                      placeholder="e.g., 1"
                      className="border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    placeholder="Higher priority offers are applied first"
                    className="border-gray-300"
                  />
                </div>

                {/* Preview */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Offer Preview</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  {showPreview && (
                    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{name || 'Untitled'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Code:</span>
                          <span className="font-mono">{code || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span>{getOfferTypeLabel(type)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Value:</span>
                          <span>
                            {type === OfferType.PERCENTAGE && `${percentageValue}%`}
                            {type === OfferType.FIXED && `₹${fixedAmountValue}`}
                            {type === OfferType.FREE_DELIVERY && 'Free Delivery'}
                            {type === OfferType.BUY_ONE_GET_ONE && 'BOGO'}
                          </span>
                        </div>
                        {maxDiscountAmount && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Max Discount:</span>
                            <span>₹{maxDiscountAmount}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Scope:</span>
                          <span>{getOfferScopeLabel(scope)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Validity:</span>
                          <span>
                            {startDate && formatDate(startDate)} - {endDate && formatDate(endDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Uses/Customer:</span>
                          <span>{maxUsesPerCustomer}</span>
                        </div>
                      </div>
                    </Card>
                  )}
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
              {loading ? 'Creating...' : 'Create Offer'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
