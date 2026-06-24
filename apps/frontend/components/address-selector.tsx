'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Edit, Trash2, Check } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CustomerAddress } from '../lib/customer-types';

interface AddressSelectorProps {
  addresses: CustomerAddress[];
  selectedAddressId: number | null;
  onSelectAddress: (addressId: number) => void;
  onAddAddress: () => void;
  onEditAddress?: (address: CustomerAddress) => void;
  onDeleteAddress?: (addressId: number) => void;
}

export function AddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
}: AddressSelectorProps) {
  const [hoveredAddressId, setHoveredAddressId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-orange-900">Delivery Address</h2>
        <Button
          onClick={onAddAddress}
          size="sm"
          className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card className="p-8 text-center">
          <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No addresses saved yet</p>
          <Button
            onClick={onAddAddress}
            className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((address, index) => (
            <motion.div
              key={address.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onMouseEnter={() => setHoveredAddressId(address.id)}
              onMouseLeave={() => setHoveredAddressId(null)}
            >
              <Card
                className={`p-4 cursor-pointer transition-all border-2 ${
                  selectedAddressId === address.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
                onClick={() => onSelectAddress(address.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Selection Indicator */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAddressId === address.id
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedAddressId === address.id && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Address Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-orange-900">{address.label}</h3>
                      {address.isDefault && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{address.name}</p>
                    <p className="text-sm text-gray-600">{address.phone}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div
                    className={`flex gap-2 transition-opacity ${
                      hoveredAddressId === address.id ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {onEditAddress && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-orange-100"
                        onClick={() => onEditAddress(address)}
                      >
                        <Edit className="h-4 w-4 text-orange-600" />
                      </Button>
                    )}
                    {onDeleteAddress && !address.isDefault && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-red-100"
                        onClick={() => onDeleteAddress(address.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
