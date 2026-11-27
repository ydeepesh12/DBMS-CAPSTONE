import React, { useState, useEffect } from 'react';
import { AppealRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Camera, 
  FileText, 
  Clock, 
  Car, 
  User, 
  AlertTriangle 
} from 'lucide-react';

export const AppealOfficerPortal: React.FC = () => {
  const [appeals, setAppeals] = useState<AppealRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ALL'>('PENDING');
  const [loading, setLoading] = useState(true);

  // Selected appeal for detail inspection & adjudication
  const [selectedAppeal, setSelectedAppeal] = useState<any | null>(null);
  const [remarks, setRemarks] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAppeals();
  }, [statusFilter]);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/appeals/queue?status=${statusFilter}`);
      const d = await res.json();
      if (d.success) setAppeals(d.data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAppeal = async (appealId: number) => {
    try {
      const res = await fetch(`/api/v1/appeals/${appealId}`);
      const d = await res.json();
      if (d.success) {
        setSelectedAppeal(d.data);
        setRemarks('');
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDecision = async (decision: 'ACCEPTED' | 'REJECTED') => {
    if (!selectedAppeal) return;
    if (remarks.trim().length < 5) {
      setMessage({ type: 'error', text: 'Please enter review remarks of at least 5 characters.' });
      return;
    }

    setDeciding(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/v1/appeals/${selectedAppeal.appeal.appeal_id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, remarks })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.error || 'Failed to submit decision.' });
      } else {
        setMessage({ type: 'success', text: data.data.message });
        setSelectedAppeal(null);
        fetchAppeals();
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black">Appeals Adjudication Tribunal</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white">SECTION 133A REVIEW</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Grievance review queue. Accept to revoke/cancel challan or Reject to enforce statutory fine via sp_decide_appeal.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(['PENDING', 'ACCEPTED', 'REJECTED', 'ALL'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              statusFilter === tab
                ? 'bg-slate-900 text-white dark:bg-purple-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab === 'ALL' ? 'All Appeals' : `${tab} Queue`}
          </button>
        ))}
      </div>

      {/* Main Content Grid: Queue list on left, Detail Drawer on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Appeals Queue List (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Appeals Dossier ({appeals.length})
          </h2>

          <div className="space-y-3">
            {appeals.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No appeals in this queue.</p>
            ) : (
              appeals.map(a => (
                <div
                  key={a.appeal_id}
                  onClick={() => handleSelectAppeal(a.appeal_id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                    selectedAppeal?.appeal.appeal_id === a.appeal_id
                      ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        Appeal #{a.appeal_id} • Challan #{a.challan_number}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {a.violation_title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Vehicle: {a.registration_no} • Applicant: {a.owner_name}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    &quot;{a.reason}&quot;
                  </p>

                  <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                    <span>Filed: {a.appeal_date}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Fine: ₹{parseFloat(String(a.total_amount)).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Adjudication Detail Drawer (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          {selectedAppeal ? (
            <div className="space-y-5">
              
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Adjudication Inspection
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Appeal #{selectedAppeal.appeal.appeal_id}
                </h3>
                <p className="text-xs text-slate-500 font-mono">Challan: {selectedAppeal.appeal.challan_number}</p>
              </div>

              {/* Citizen grounds */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contest Grounds / Statement:</label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {selectedAppeal.appeal.reason}
                </div>
              </div>

              {/* Camera evidence preview */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-500" />
                  <span>Photographic Camera Evidence Feed</span>
                </label>

                {selectedAppeal.evidence.sql && selectedAppeal.evidence.sql.length > 0 ? (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-950 flex items-center justify-center">
                    <img
                      src={selectedAppeal.evidence.sql[0].storage_path}
                      alt="Evidence"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    No camera evidence attached
                  </div>
                )}
              </div>

              {/* Decision form if PENDING */}
              {selectedAppeal.appeal.appeal_status === 'PENDING' ? (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Adjudication Officer Remarks *
                  </label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Enter statutory reason for acceptance or rejection..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => handleDecision('ACCEPTED')}
                      disabled={deciding}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept & Cancel Challan</span>
                    </button>

                    <button
                      onClick={() => handleDecision('REJECTED')}
                      disabled={deciding}
                      className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Appeal</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Decision Outcome:</span>
                    <StatusBadge status={selectedAppeal.appeal.appeal_status} />
                  </div>
                  <div className="text-slate-700 dark:text-slate-300">
                    Remarks: {selectedAppeal.appeal.officer_remarks || 'None recorded'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Decided on: {selectedAppeal.appeal.decision_date}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="py-16 text-center space-y-2 text-slate-400">
              <Eye className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs">Select an appeal dossier from the list to review evidence and adjudicate.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
