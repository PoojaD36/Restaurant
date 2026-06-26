'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { IndianRupee, Smartphone, Banknote, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { createPaymentLink, getPaymentLinkStatus } from '../lib/payment-api';

interface CollectPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: 'CASH' | 'UPI', transactionId?: string) => void;
  totalAmount: number;
  orderId: number;
  isLoading?: boolean;
}

export function CollectPaymentModal({
  open,
  onClose,
  onConfirm,
  totalAmount,
  orderId,
  isLoading = false,
}: CollectPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{
    shortUrl: string;
    paymentLinkId: string;
  } | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setPaymentMethod(null);
      setQrCodeData(null);
      setPaymentStatus('pending');
    }
  }, [open]);

  // Generate QR code when UPI is selected
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    const generateQrCode = async () => {
      if (paymentMethod !== 'UPI') return;

      setIsGeneratingQr(true);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await createPaymentLink(token, {
          amount: totalAmount,
          orderId,
          description: `Payment for Order #${orderId}`,
        });

        if (response.success) {
          setQrCodeData({
            shortUrl: response.data.shortUrl,
            paymentLinkId: response.data.id,
          });

          // Start polling for payment status
          pollInterval = setInterval(async () => {
            try {
              setIsCheckingPayment(true);
              const statusResponse = await getPaymentLinkStatus(token, response.data.id);

              if (statusResponse.success && statusResponse.data.status === 'paid') {
                setPaymentStatus('completed');
                if (pollInterval) clearInterval(pollInterval);
              }
            } catch (error) {
              console.error('Error checking payment status:', error);
            } finally {
              setIsCheckingPayment(false);
            }
          }, 3000); // Poll every 3 seconds
        }
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        setPaymentStatus('failed');
      } finally {
        setIsGeneratingQr(false);
      }
    };

    generateQrCode();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [paymentMethod, totalAmount, orderId]);

  const handleConfirm = () => {
    if (!paymentMethod) return;

    // For UPI, pass the payment link ID as transaction ID
    if (paymentMethod === 'UPI' && qrCodeData) {
      onConfirm(paymentMethod, qrCodeData.paymentLinkId);
    } else {
      onConfirm(paymentMethod);
    }

    // Reset form
    setPaymentMethod(null);
    setQrCodeData(null);
    setPaymentStatus('pending');
  };

  const handleClose = () => {
    setPaymentMethod(null);
    setQrCodeData(null);
    setPaymentStatus('pending');
    onClose();
  };

  const isPaymentCompleted = paymentStatus === 'completed';

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
            <div className="grid grid-cols-2 gap-3">
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
            </div>
          </div>

          {/* QR Code Display for UPI */}
          {paymentMethod === 'UPI' && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              {isGeneratingQr ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-orange-600 animate-spin mb-3" />
                  <p className="text-sm text-gray-600">Generating QR Code...</p>
                </div>
              ) : paymentStatus === 'failed' ? (
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-red-700">Failed to generate QR code. Please try Cash payment.</p>
                </div>
              ) : qrCodeData ? (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4 space-y-3">
                  {isPaymentCompleted ? (
                    <div className="flex flex-col items-center py-4">
                      <CheckCircle2 className="h-16 w-16 text-green-600 mb-3" />
                      <p className="text-lg font-semibold text-green-700">Payment Completed!</p>
                      <p className="text-sm text-gray-600 mt-1">You can now mark the order as delivered.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center">
                        <div className="bg-white p-2 rounded-lg mb-3">
                          <QRCodeSVG
                            value={qrCodeData.shortUrl}
                            size={180}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                        <p className="text-xs text-gray-600 text-center mb-2">
                          Scan QR code with any UPI app
                        </p>
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <Clock className="h-3 w-3 animate-pulse" />
                          {isCheckingPayment ? 'Waiting for payment...' : 'Checking payment status...'}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-600 mb-1">Payment link (if scan fails):</p>
                        <a
                          href={qrCodeData.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline break-all"
                        >
                          {qrCodeData.shortUrl}
                        </a>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Cash Payment Info */}
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
            disabled={!paymentMethod || isLoading || (paymentMethod === 'UPI' && !isPaymentCompleted)}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Processing...' : 'Confirm & Mark Delivered'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
