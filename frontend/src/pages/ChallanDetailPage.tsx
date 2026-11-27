import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Challan } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PaymentModal } from '../components/PaymentModal';
import { AppealModal } from '../components/AppealModal';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  CreditCard, 
  ShieldAlert, 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  Camera, 
  History, 
  CheckCircle2, 
  AlertTriangle,
  QrCode
} from 'lucide-react';

export const ChallanDetailPage: React.FC = () => {
  const { challanId } = useParams<{ challanId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<{
    challan: Challan & any;
    timeline: any[];
    evidence: { sql: any[]; mongo: any[] };
    auditLogs: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [appealModalOpen, setAppealModalOpen] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/citizens/challan/${challanId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.error || 'Failed to fetch challan details.');
      } else {
        setData(json.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [challanId]);

  const handleDownloadPdf = () => {
    window.open(`/api/v1/citizens/receipt/${challanId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-500">Retrieving E-Challan records and audit trail...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Not Found</h2>
        <p className="text-sm text-slate-500">{errorMsg || 'Challan record could not be loaded.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
        >
          Return to Search
        </button>
      </div>
    );
  }

  const { challan, timeline, evidence, auditLogs } = data;
  const isPaid = challan.status === 'PAID';
  const isAppealed = challan.status === 'APPEALED';
  const isCancelled = challan.status === 'CANCELLED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:py-0 print:px-0">
      
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Records</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet</span>
          </button>

          {isPaid && (
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Receipt (QR)</span>
            </button>
          )}

          {!isPaid && !isCancelled && (
            <>
              {!isAppealed && (
                <button
                  onClick={() => setAppealModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>File Appeal</span>
                </button>
              )}

              <button
                onClick={() => setPayModalOpen(true)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition flex items-center space-x-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Challan Online</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Challan Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Banner Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">E-Challan Official Notice</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">Section 133A MV Act</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              Challan #{challan.challan_number}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Issued On: {challan.issue_date} • Due Date: {challan.due_date}
            </p>
          </div>

          <div className="text-left sm:text-right flex sm:flex-col items-start sm:items-end justify-between">
            <StatusBadge status={challan.status} className="text-sm px-3 py-1" />
            <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-400">
              ₹{parseFloat(String(challan.total_amount)).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Breakdown & Information Grid */}
        <div className="p-6 sm:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Vehicle & Owner Info */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <User className="w-4 h-4 text-amber-500" />
                <span>Vehicle & Owner Particulars</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500">Registration Number:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{challan.registration_no}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500">Make & Model:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{challan.make_model} ({challan.vehicle_type})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500">Registered Owner:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{challan.owner_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500">Owner Contact:</span>
                  <span className="text-slate-700 dark:text-slate-300">{challan.owner_phone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Chassis / Engine:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">{challan.chassis_no}</span>
                </div>
              </div>
            </div>

            {/* Violation Details */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <span>Offense & Enforcement Details</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500">Violation:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{challan.violation_title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500">Act & Section:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{challan.section_act}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="text-slate-800 dark:text-slate-200">{challan.violation_timestamp}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-800 dark:text-slate-200">{challan.junction_name}, {challan.area_name}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Enforcing Officer:</span>
                  <span className="text-slate-800 dark:text-slate-200">{challan.recording_officer_name} ({challan.recording_officer_badge})</span>
                </div>
              </div>
            </div>

          </div>

          {/* Financial Breakdown Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Statutory Fine Settlement</h3>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4">Component</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">Statutory Fine</td>
                    <td className="py-2.5 px-4 text-slate-500">Base penalty levied for {challan.violation_title}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium">₹{parseFloat(String(challan.fine_amount)).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">Late Fee / Penalty Surcharge</td>
                    <td className="py-2.5 px-4 text-slate-500">Overdue compounding fee calculated via fn_late_fee</td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-red-600 dark:text-red-400">
                      ₹{parseFloat(String(challan.late_fee || 0)).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold">
                    <td colSpan={2} className="py-3 px-4 text-slate-900 dark:text-white">Total Amount Demanded</td>
                    <td className="py-3 px-4 text-right font-black text-sm text-amber-600 dark:text-amber-400">
                      ₹{parseFloat(String(challan.total_amount)).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Evidence Preview Gallery */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Camera className="w-4 h-4 text-amber-500" />
              <span>Surveillance Camera Evidence Preview</span>
            </h3>

            {evidence.sql && evidence.sql.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {evidence.sql.map((ev: any) => (
                  <div key={ev.evidence_id} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950 text-white p-3 space-y-2">
                    <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center relative">
                      <img
                        src={ev.storage_path}
                        alt="Violation Evidence"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if file path does not load
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-amber-400 border border-amber-500/30">
                        ANPR CAPTURE
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Media: {ev.media_type}</span>
                      <span>File Size: {ev.file_size_kb} KB</span>
                    </div>
                    {ev.mongo_evidence_id && (
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        MongoDB Ref: {ev.mongo_evidence_id}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500 border border-slate-200 dark:border-slate-800">
                No direct camera capture attached to this record.
              </div>
            )}
          </div>

          {/* Lifecycle Timeline */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Challan Official Lifecycle Timeline</span>
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {timeline.map((step: any, idx: number) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900"></div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{step.title}</span>
                    <span className="text-[10px] text-slate-400">({step.timestamp})</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail (Database Verification) */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <History className="w-4 h-4 text-purple-500" />
              <span>Database Audit Log Ledger (Trigger Enforced)</span>
            </h3>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="py-2 px-3">Audit ID</th>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Status Transition</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Logged By</th>
                    <th className="py-2 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {auditLogs.map((a: any) => (
                    <tr key={a.audit_id}>
                      <td className="py-2 px-3">#{a.audit_id}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">{a.action}</td>
                      <td className="py-2 px-3">
                        <span className="text-slate-400">{a.old_status || 'NULL'}</span>
                        <span className="mx-1">→</span>
                        <span className="font-bold text-amber-500">{a.new_status}</span>
                      </td>
                      <td className="py-2 px-3">₹{parseFloat(a.new_amount).toFixed(2)}</td>
                      <td className="py-2 px-3 text-slate-500">{a.performed_by}</td>
                      <td className="py-2 px-3 text-slate-400">{a.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Payment Gateway Modal */}
      <PaymentModal
        challan={challan}
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        onSuccess={() => {
          setPayModalOpen(false);
          fetchDetails();
        }}
      />

      {/* Appeal Filing Modal */}
      <AppealModal
        challan={challan}
        isOpen={appealModalOpen}
        onClose={() => setAppealModalOpen(false)}
        onSuccess={() => {
          setAppealModalOpen(false);
          fetchDetails();
        }}
      />

    </div>
  );
};
