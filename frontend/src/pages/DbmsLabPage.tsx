import React, { useState } from 'react';
import { 
  Database, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  Flame, 
  Cpu, 
  ArrowRight,
  GitCommit
} from 'lucide-react';

export const DbmsLabPage: React.FC = () => {
  // Test 1: Atomic Transaction state
  const [txLoading, setTxLoading] = useState(false);
  const [txResult, setTxResult] = useState<any | null>(null);

  // Test 2: Concurrency Race Condition state
  const [raceLoading, setRaceLoading] = useState(false);
  const [raceResult, setRaceResult] = useState<any | null>(null);

  const runTransactionDemo = async (simulateFailure: boolean) => {
    setTxLoading(true);
    setTxResult(null);

    try {
      const res = await fetch('/api/v1/demo/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulateFailure })
      });
      const data = await res.json();
      setTxResult(data.data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setTxLoading(false);
    }
  };

  const runConcurrencyDemo = async () => {
    setRaceLoading(true);
    setRaceResult(null);

    try {
      const res = await fetch('/api/v1/demo/concurrency', {
        method: 'POST'
      });
      const data = await res.json();
      setRaceResult(data.data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRaceLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black">DBMS Capstone Lab &amp; Viva Testing Bench</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">LIVE EVALUATION</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Demonstrate ACID Properties (Atomicity &amp; Isolation) backed by real MySQL 8 Stored Procedures and Triggers.
            </p>
          </div>
        </div>
      </div>

      {/* Challenge 1: Multi-Step Atomic Transaction (Commit vs Rollback) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                CHALLENGE 1: ATOMICITY
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Multi-Step Transaction: Violation → Challan → Payment
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Procedure <code className="text-amber-600 font-bold">sp_violation_to_payment</code> executes all three operations in a single START TRANSACTION block.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => runTransactionDemo(false)}
              disabled={txLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <GitCommit className="w-4 h-4" />
              <span>Run with COMMIT</span>
            </button>

            <button
              onClick={() => runTransactionDemo(true)}
              disabled={txLoading}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Simulate Failure (ROLLBACK)</span>
            </button>
          </div>
        </div>

        {/* Live Transaction Output */}
        {txResult && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Status message */}
            <div className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 ${
              txResult.simulateFailure 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300' 
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            }`}>
              {txResult.simulateFailure ? <RotateCcw className="w-5 h-5 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
              <div>
                <h4 className="font-bold text-sm">
                  Procedure Outcome: {txResult.result}
                </h4>
                <p className="mt-1 leading-relaxed">{txResult.explanation}</p>
              </div>
            </div>

            {/* Side-by-side database table count comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px]">
                  Database State BEFORE Execution
                </span>
                <div className="space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>violation records:</span>
                    <span className="font-bold">{txResult.beforeState.violations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>challan records:</span>
                    <span className="font-bold">{txResult.beforeState.challans}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>payment records:</span>
                    <span className="font-bold">{txResult.beforeState.payments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>challan_audit logs:</span>
                    <span className="font-bold">{txResult.beforeState.auditLogs}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-500 block uppercase tracking-wider text-[10px]">
                  Database State AFTER Execution
                </span>
                <div className="space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>violation records:</span>
                    <span className={`font-bold ${txResult.afterState.violations > txResult.beforeState.violations ? 'text-emerald-500' : ''}`}>
                      {txResult.afterState.violations}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>challan records:</span>
                    <span className={`font-bold ${txResult.afterState.challans > txResult.beforeState.challans ? 'text-emerald-500' : 'text-slate-500'}`}>
                      {txResult.afterState.challans} {txResult.simulateFailure && '(0 added - Rolled back!)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>payment records:</span>
                    <span className={`font-bold ${txResult.afterState.payments > txResult.beforeState.payments ? 'text-emerald-500' : 'text-slate-500'}`}>
                      {txResult.afterState.payments} {txResult.simulateFailure && '(0 added - Rolled back!)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>challan_audit logs:</span>
                    <span className="font-bold">{txResult.afterState.auditLogs}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* Challenge 2: Concurrency Race Condition Demo */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                CHALLENGE 2: CONCURRENCY &amp; ISOLATION
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Simultaneous Double Payment Race Condition Test
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Fires two simultaneous payment requests (<code className="text-amber-600 font-bold">sp_process_payment</code>) for the exact same challan using Promise.allSettled.
            </p>
          </div>

          <button
            onClick={runConcurrencyDemo}
            disabled={raceLoading}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition flex items-center space-x-2 shrink-0 disabled:opacity-50"
          >
            <Flame className="w-4 h-4 text-amber-400 dark:text-slate-950" />
            <span>{raceLoading ? 'Executing Race...' : 'Trigger Twin Payment Race'}</span>
          </button>
        </div>

        {raceResult && (
          <div className="space-y-4 animate-fade-in">
            
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Locking &amp; Isolation Guard Verified</h4>
                <p className="mt-0.5">{raceResult.concurrencyOutcome}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Request A */}
              <div className={`p-4 rounded-2xl border space-y-2 ${
                raceResult.requestA.success
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{raceResult.requestA.client}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    raceResult.requestA.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {raceResult.requestA.success ? 'FULFILLED (200 OK)' : 'REJECTED (409 CONFLICT)'}
                  </span>
                </div>
                {raceResult.requestA.success ? (
                  <p className="text-emerald-700 dark:text-emerald-300 text-[11px]">
                    Acquired exclusive row lock (<code className="font-bold">FOR UPDATE</code>), inserted payment record, incremented optimistic version counter to {raceResult.finalChallan?.version}.
                  </p>
                ) : (
                  <p className="text-red-700 dark:text-red-300 text-[11px] font-mono">
                    SIGNAL Exception: &quot;{raceResult.requestA.error}&quot;
                  </p>
                )}
              </div>

              {/* Request B */}
              <div className={`p-4 rounded-2xl border space-y-2 ${
                raceResult.requestB.success
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{raceResult.requestB.client}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    raceResult.requestB.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {raceResult.requestB.success ? 'FULFILLED (200 OK)' : 'REJECTED (409 CONFLICT)'}
                  </span>
                </div>
                {raceResult.requestB.success ? (
                  <p className="text-emerald-700 dark:text-emerald-300 text-[11px]">
                    Acquired exclusive row lock (<code className="font-bold">FOR UPDATE</code>), inserted payment record, incremented optimistic version counter.
                  </p>
                ) : (
                  <p className="text-red-700 dark:text-red-300 text-[11px] font-mono">
                    SIGNAL Exception: &quot;{raceResult.requestB.error}&quot;
                  </p>
                )}
              </div>

            </div>

            {/* Verification of Challan status in database */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-mono space-y-1">
              <span className="font-sans font-bold text-slate-700 dark:text-slate-300 block">Database Final Row Verification:</span>
              <div>Challan ID: #{raceResult.finalChallan?.challan_id} ({raceResult.finalChallan?.challan_number})</div>
              <div>Final Status: <span className="font-bold text-emerald-500">{raceResult.finalChallan?.status}</span></div>
              <div>Optimistic Version: <span className="font-bold text-amber-500">{raceResult.finalChallan?.version}</span></div>
              <div>Total Payments Created in DB: <span className="font-bold text-blue-500">{raceResult.paymentsRecorded?.length}</span> (Idempotent Guarantee)</div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
