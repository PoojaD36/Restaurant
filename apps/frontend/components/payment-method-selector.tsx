'use client';

import { CreditCard, Banknote } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800">Payment Method</h3>

      <div className="space-y-2">
        {/* Online Payment Option */}
        <button
          type="button"
          onClick={() => onMethodChange('online')}
          className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
            selectedMethod === 'online'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 bg-white hover:border-orange-300'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              selectedMethod === 'online'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <CreditCard size={24} />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-gray-800">Pay Online</div>
            <div className="text-sm text-gray-500">
              UPI, Cards, Wallets, Netbanking
            </div>
          </div>
          {selectedMethod === 'online' && (
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          )}
        </button>

        {/* Cash on Delivery Option */}
        <button
          type="button"
          onClick={() => onMethodChange('cod')}
          className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
            selectedMethod === 'cod'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 bg-white hover:border-orange-300'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              selectedMethod === 'cod'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Banknote size={24} />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-gray-800">Cash on Delivery</div>
            <div className="text-sm text-gray-500">Pay cash at delivery</div>
          </div>
          {selectedMethod === 'cod' && (
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          )}
        </button>
      </div>

      {/* Info Message */}
      {selectedMethod === 'cod' && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Note:</span> Please keep exact change ready
            for a smooth delivery experience.
          </p>
        </div>
      )}
    </div>
  );
}
