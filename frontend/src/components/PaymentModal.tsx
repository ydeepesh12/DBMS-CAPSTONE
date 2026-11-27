import React, { useState } from 'react';
import { Challan } from '../types';
import { X, ShieldCheck, CheckCircle2, AlertOctagon, Smartphone, CreditCard, Building } from 'lucide-react';

interface PaymentModalProps {
  challan: Challan;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ challan, isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [method, setMethod] = useState<'UPI' | 'CREDIT_CARD' | 'NET_BANKING'>('UPI');
  const [upiId, setUpiId] = useState('citizen@okhdfcbank');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePay = async (simulateFailure: boolean = false) => {
    setLoading(true);
    setErrorMsg(null);

    const txnRef = `TXN-${method}-${Date.now()}`;
    const amountNum = parseFloat(String(challan.total_amount));

    try {
      const res = await fetch('/api/v1/citizens/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challanId: challan.challan_id,
          amount: amountNum,
          paymentMethod: method,
          transactionReference: txnRef,
          simulateFailure
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Payment transaction failed.');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error communicating with payment gateway.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              ₹
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Pay Traffic Challan</h3>
              <p className="text-xs text-slate-400">Secure Government Payment Gateway</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Challan summary card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Challan Number:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{challan.challan_number}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Vehicle:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{challan.registration_no}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Base Fine:</span>
              <span>₹{parseFloat(String(challan.fine_amount || 0)).toFixed(2)}</span>
            </div>
            {parseFloat(String(challan.late_fee || 0)) > 0 && (
              <div className="flex justify-between text-xs text-red-600 dark:text-red-400 font-semibold">
                <span>Late Fee (Overdue):</span>
                <span>+ ₹{parseFloat(String(challan.late_fee)).toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
              <span>Total Payable Amount:</span>
              <span className="text-xl text-amber-600 dark:text-amber-400 font-black">
                ₹{parseFloat(String(challan.total_amount || 0)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('UPI')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition ${
                  method === 'UPI'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CREDIT_CARD')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition ${
                  method === 'CREDIT_CARD'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('NET_BANKING')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition ${
                  method === 'NET_BANKING'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Building className="w-5 h-5" />
                <span className="text-xs">NetBanking</span>
              </button>
            </div>
          </div>

          {method === 'UPI' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">UPI ID (VPA)</label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2 text-xs text-red-600 dark:text-red-300">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => handlePay(false)}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Calling sp_process_payment...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize & Pay (Success)</span>
                </>
              )}
            </button>

            {/* Test Simulation Button */}
            <button
              onClick={() => handlePay(true)}
              disabled={loading}
              className="w-full py-2 px-4 rounded-xl font-medium text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
            >
              Simulate Gateway Bank Decline (Failure Test)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
