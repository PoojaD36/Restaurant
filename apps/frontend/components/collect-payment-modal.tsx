'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { IndianRupee, CreditCard, Smartphone, Banknote } from 'lucide-react';

interface CollectPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: 'CASH' | 'UPI' | 'CARD', transactionId?: string) => void;
  totalAmount: number;
  isLoading?: boolean;
}

export function CollectPaymentModal({
  open,
  onClose,
  onConfirm,
  totalAmount,
  isLoading = false,
}: CollectPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | null>(null);
  const [transactionId, setTransactionId] = useState('');

  const handleConfirm = () => {
    if (!paymentMethod) return;

    // UPI and CARD payments require transaction ID
    if ((paymentMethod === 'UPI' || paymentMethod === 'CARD') && !transactionId.trim()) {
      alert('Please enter the transaction ID for this payment');
      return;
    }

    onConfirm(paymentMethod, transactionId.trim() || undefined);
    // Reset form
    setPaymentMethod(null);
    setTransactionId('');
  };

  const handleClose = () => {
    setPaymentMethod(null);
    setTransactionId('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Collect Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amount Display */}
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-1">Amount to Collect</p>
            <p className="text-3xl font-bold text-orange-600 flex items-center justify-center gap-2">
              <IndianRupee className="h-6 w-6" />
              {totalAmount}
            </p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Payment Method</Label>
            <div className="grid grid-cols-3 gap-3">
              {/* Cash Option */}
              <button
                onClick={() => setPaymentMethod('CASH')}
                disabled={isLoading}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${paymentMethod === 'CASH'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300 bg-white'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Banknote className={`h-6 w-6 ${paymentMethod === 'CASH' ? 'text-orange-600' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'CASH' ? 'text-orange-700' : 'text-gray-600'}`}>
                  Cash
                </span>
              </button>

              {/* UPI Option */}
              <button
                onClick={() => setPaymentMethod('UPI')}
                disabled={isLoading}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${paymentMethod === 'UPI'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300 bg-white'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Smartphone className={`h-6 w-6 ${paymentMethod === 'UPI' ? 'text-orange-600' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'UPI' ? 'text-orange-700' : 'text-gray-600'}`}>
                  UPI
                </span>
              </button>

              {/* Card Option */}
              <button
                onClick={() => setPaymentMethod('CARD')}
                disabled={isLoading}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${paymentMethod === 'CARD'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300 bg-white'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <CreditCard className={`h-6 w-6 ${paymentMethod === 'CARD' ? 'text-orange-600' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'CARD' ? 'text-orange-700' : 'text-gray-600'}`}>
                  Card
                </span>
              </button>
            </div>
          </div>

          {/* Transaction ID Input (for UPI/Card) */}
          {(paymentMethod === 'UPI' || paymentMethod === 'CARD') && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <Label htmlFor="transactionId">Transaction ID / UTR <span className="text-red-500">*</span></Label>
              <Input
                id="transactionId"
                placeholder="Enter 12-digit UTR / Transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                disabled={isLoading}
                maxLength={50}
              />
              <p className="text-xs text-gray-500">
                Enter the transaction ID from the payment confirmation
              </p>
            </div>
          )}

          {paymentMethod === 'CASH' && (
            <div className="bg-green-50 p-3 rounded-lg animate-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-green-700">
                ✓ Collect ₹{totalAmount} in cash from the customer
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!paymentMethod || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Processing...' : 'Confirm & Mark Delivered'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
