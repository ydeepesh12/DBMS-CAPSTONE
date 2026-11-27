import React, { useState } from 'react';
import { Challan } from '../types';
import { X, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AppealModalProps {
  challan: Challan;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AppealModal: React.FC<AppealModalProps> = ({ challan, isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [reason, setReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check 15-day appeal window
  const isWindowExpired = challan.appeal_window_end 
    ? new Date().toISOString().split('T')[0] > challan.appeal_window_end 
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setErrorMsg('Please describe your grievance in at least 10 characters.');
      return;
    }
    if (!agreed) {
      setErrorMsg('Please confirm the statutory truth declaration.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/citizens/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challanId: challan.challan_id,
          reason
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to submit grievance appeal.');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">File Grievance / Appeal</h3>
              <p className="text-xs text-slate-400">Section 133A Review Application</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Notice Banner */}
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Statutory 15-Day Appeal Window</span>
            </div>
            <p>
              Appeals can only be lodged within 15 days of challan issuance (Deadline: {challan.appeal_window_end || 'Within 15 days'}). An Adjudication Officer will review the camera feed and radar logs.
            </p>
          </div>

          {isWindowExpired && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300 font-semibold">
              Warning: The 15-day statutory appeal window for this challan has elapsed. Stored procedure sp_file_appeal will reject expired appeals.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Contest / Grounds of Appeal *
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="E.g., Vehicle was not at this location, emergency ambulance passage, number plate mistyped, helmet was worn with ISI mark..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <label className="flex items-start space-x-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>I declare that the information provided is truthful. Falsification of evidence or false affidavits is punishable under Indian Penal Code Section 193.</span>
          </label>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Submitting Appeal...' : 'Submit Grievance'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
