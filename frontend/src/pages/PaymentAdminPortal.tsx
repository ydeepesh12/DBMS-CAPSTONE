import React, { useState, useEffect } from 'react';
import { Challan } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PaymentModal } from '../components/PaymentModal';
import { 
  CreditCard, 
  Search, 
  Download, 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  BarChart2, 
  History,
  FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

export const PaymentAdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OUTSTANDING' | 'HISTORY' | 'REPORTS'>('OUTSTANDING');
  
  // Outstanding list
  const [outstanding, setOutstanding] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [loading, setLoading] = useState(true);

  // Selected challan for counter payment
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Payments history
  const [history, setHistory] = useState<any[]>([]);

  // Monthly collection report
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchOutstanding();
    fetchHistory();
    fetchMonthlyReport();
  }, [search, filterOverdue]);

  const fetchOutstanding = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (filterOverdue) q.append('overdue', 'true');

      const res = await fetch(`/api/v1/payments/outstanding?${q.toString()}`);
      const d = await res.json();
      if (d.success) setOutstanding(d.data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/v1/payments/history');
      const d = await res.json();
      if (d.success) setHistory(d.data);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const res = await fetch('/api/v1/payments/monthly-report');
      const d = await res.json();
      if (d.success) setMonthlyData(d.data);
    } catch (e) {
      console.warn(e);
    }
  };

  // Run Batch Late Fees (sp_apply_late_fees)
  const handleApplyLateFees = async () => {
    if (!window.confirm('Run batch late fee update? This will execute stored procedure sp_apply_late_fees across all overdue challans in the database.')) {
      return;
    }

    try {
      const res = await fetch('/api/v1/payments/apply-late-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asOfDate: new Date().toISOString().split('T')[0] })
      });
      const d = await res.json();
      if (d.success) {
        setMessage({
          type: 'success',
          text: `Late fees calculated & applied successfully. Total Overdue: ${d.data.stats.overdue_count}, Total Late Surcharge: ₹${parseFloat(d.data.stats.total_late_fees).toFixed(2)}`
        });
        fetchOutstanding();
      } else {
        setMessage({ type: 'error', text: d.error || 'Failed to run late fees batch' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  // Export CSV of Outstanding Challans
  const handleExportCsv = () => {
    if (outstanding.length === 0) return;
    const headers = ['Challan Number', 'Vehicle', 'Owner Name', 'Phone', 'Violation', 'Base Fine', 'Late Fee', 'Total Due', 'Due Date', 'Days Overdue'];
    const rows = outstanding.map(o => [
      o.challan_number,
      o.registration_no,
      o.owner_name,
      o.owner_phone,
      `"${o.violation_title}"`,
      o.fine_amount,
      o.late_fee,
      o.total_amount,
      o.due_date,
      o.days_overdue
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `outstanding_challans_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black">Payment Administration Counter</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950">AUTHORIZED DESK</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Outstanding challan ledger, counter payment settlement via sp_process_payment, and batch late fee compounding.
            </p>
          </div>
        </div>

        {/* Batch Late Fees Button */}
        <button
          onClick={handleApplyLateFees}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center space-x-2 shrink-0"
        >
          <Clock className="w-4 h-4" />
          <span>Apply Late Fees (sp_apply_late_fees)</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('OUTSTANDING')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'OUTSTANDING'
              ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Outstanding Challans ({outstanding.length})
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'HISTORY'
              ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Payments History ({history.length})
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'REPORTS'
              ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Monthly Revenue Charts
        </button>
      </div>

      {/* Tab 1: Outstanding Challans Table */}
      {activeTab === 'OUTSTANDING' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search Challan No, Vehicle, or Owner..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterOverdue}
                  onChange={e => setFilterOverdue(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="font-semibold text-red-600 dark:text-red-400">Only Overdue</span>
              </label>

              <button
                onClick={handleExportCsv}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Challan Number</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Owner Name</th>
                  <th className="py-3 px-4">Offense</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total Due</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {outstanding.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No outstanding challans matching the filter.
                    </td>
                  </tr>
                ) : (
                  outstanding.map(o => (
                    <tr key={o.challan_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {o.challan_number}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                        {o.registration_no}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{o.owner_name}</span>
                        <p className="text-[10px] text-slate-400">{o.owner_phone}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {o.violation_title}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 dark:text-slate-300">{o.due_date}</span>
                        {o.days_overdue > 0 && (
                          <span className="ml-1 text-[10px] font-bold text-red-500">
                            (+{o.days_overdue}d late)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        ₹{parseFloat(o.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedChallan(o);
                            setPaymentModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition shadow-sm"
                        >
                          Collect Cash/UPI
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Tab 2: Payments History */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Completed Payment Audit Logs</h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Receipt Number</th>
                  <th className="py-3 px-4">Challan Number</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Txn Ref</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Amount Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {history.map(h => (
                  <tr key={h.payment_id}>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{h.receipt_number}</td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white font-semibold">{h.challan_number}</td>
                    <td className="py-3 px-4">{h.registration_no}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-sans">{h.payment_method}</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{h.transaction_reference}</td>
                    <td className="py-3 px-4 text-slate-500 font-sans">{h.payment_date}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white font-sans">
                      ₹{parseFloat(h.amount_paid).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Monthly Revenue Charts */}
      {activeTab === 'REPORTS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-amber-500" />
              <span>Monthly Enforcement Collections (INR)</span>
            </h3>
            <p className="text-xs text-slate-500">Aggregated revenue generated from traffic infraction settlements</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month_label" />
                <YAxis />
                <Tooltip
                  formatter={(val: any) => [`₹${parseFloat(val).toLocaleString()}`, 'Total Collected']}
                />
                <Bar dataKey="total_collected" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedChallan && (
        <PaymentModal
          challan={selectedChallan}
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={() => {
            setPaymentModalOpen(false);
            setMessage({ type: 'success', text: `Payment collected for Challan ${selectedChallan.challan_number} via sp_process_payment.` });
            fetchOutstanding();
            fetchHistory();
          }}
        />
      )}

    </div>
  );
};
