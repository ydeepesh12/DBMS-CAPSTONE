import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Challan } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Search, 
  ShieldCheck, 
  CreditCard, 
  FileText, 
  ArrowRight, 
  AlertCircle, 
  Car, 
  MapPin, 
  Clock, 
  Sparkles,
  Database
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Challan[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const samplePlates = ['DL01AB1234', 'MH02CD5678', 'KA03EF9012', 'HR26BC3456', 'WB04GH7890'];

  const handleSearch = async (searchQuery: string = query) => {
    const q = searchQuery.trim();
    if (!q) {
      setErrorMsg('Please enter a vehicle registration or challan number.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/v1/citizens/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to search challan records.');
        setResults(null);
      } else {
        setResults(data.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 px-6 sm:px-12 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ministry of Road Transport & Highways E-Enforcement</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Traffic Violation & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500">
              Smart Challan Portal
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Instant electronic challan search, photographic radar evidence verification, secure online payment, and statutory dispute adjudication under Section 133A of the Motor Vehicles Act.
          </p>

          {/* Search Box */}
          <div className="pt-4">
            <div className="p-2 sm:p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter Vehicle RC (e.g. DL01AB1234) or Challan No"
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-sm font-semibold tracking-wider placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-amber-500 border border-slate-200 dark:border-slate-800"
                />
              </div>
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
              >
                {loading ? (
                  <span>Searching...</span>
                ) : (
                  <>
                    <span>Check Challan</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Search Chips */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="font-medium">Quick Demo Vehicles:</span>
              {samplePlates.map(plate => (
                <button
                  key={plate}
                  onClick={() => {
                    setQuery(plate);
                    handleSearch(plate);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-300 font-mono text-[11px] border border-slate-700 transition"
                >
                  {plate}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-700 rounded-xl text-xs text-red-200 flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>
      </section>

      {/* Search Results Display Section */}
      {results !== null && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Car className="w-5 h-5 text-amber-500" />
              <span>Search Results ({results.length} Found)</span>
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Clean Record! No Pending Violations</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active traffic infractions or unpaid e-challans were found for the query &quot;{query}&quot;. Drive safely and obey speed limits!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map(c => (
                <div
                  key={c.challan_id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          {c.challan_number}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {c.violation_title}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">{c.section_act}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Vehicle No:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.registration_no}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Owner:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.owner_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Location:</span>
                        <span className="text-slate-700 dark:text-slate-300">{c.junction_name || c.area_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Issue Date:</span>
                        <span className="text-slate-700 dark:text-slate-300">{c.issue_date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Total Fine</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        ₹{parseFloat(String(c.total_amount)).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/challan/${c.challan_id}`)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
                    >
                      <span>View & Settle</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Live Stats Counters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-2xl sm:text-3xl font-black text-amber-500">100%</span>
            <p className="text-xs text-slate-500 font-medium mt-1">ACID Automated Stored Procs</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-2xl sm:text-3xl font-black text-emerald-500">98.4%</span>
            <p className="text-xs text-slate-500 font-medium mt-1">Camera ANPR AI Accuracy</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-2xl sm:text-3xl font-black text-blue-500">15 Days</span>
            <p className="text-xs text-slate-500 font-medium mt-1">Statutory Appeal Review Window</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-2xl sm:text-3xl font-black text-purple-500">Instant</span>
            <p className="text-xs text-slate-500 font-medium mt-1">QR Code Verifiable Receipt</p>
          </div>
        </div>
      </section>

      {/* How it works 3-step guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">How SmartChallan Works</h2>
          <p className="text-xs text-slate-500">End-to-end automated enforcement lifecycle powered by MySQL 8 database objects</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 font-bold flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Violation Detection & Evidence</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automated high-speed ANPR cameras capture vehicle license plate and speed radar telemetry. Metadata is archived in MongoDB with full cryptographic MD5 hashes.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-bold flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Stored Procedure Challan Issue</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Database stored procedure <code className="text-blue-600 dark:text-blue-400">sp_generate_challan</code> computes statutory fines, generates unique serial numbers, and locks audit records.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 font-bold flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Settlement or Dispute Appeal</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Citizens can settle immediately via UPI/Gateway using <code className="text-emerald-600 dark:text-emerald-400">sp_process_payment</code> or file an appeal under Section 133A within 15 days.
            </p>
          </div>
        </div>
      </section>

      {/* DBMS Lab Viva Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-3xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <Database className="w-5 h-5" />
              <span>COLLEGE DBMS CAPSTONE LAB & VIVA MODE</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Demonstrate ACID Transactions & Concurrency Race Guards Live
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
              Includes interactive live demonstration of multi-step atomic procedures with simulated ROLLBACK vs COMMIT, plus twin concurrent payment requests verifying pessimistic row locks!
            </p>
          </div>
          <button
            onClick={() => navigate('/dbms-lab')}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 shrink-0 transition"
          >
            Open DBMS Lab Demo →
          </button>
        </div>
      </section>

    </div>
  );
};
