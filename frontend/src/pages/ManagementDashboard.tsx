import React, { useState, useEffect } from 'react';
import { HotspotMap } from '../components/HotspotMap';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  DollarSign, 
  Car, 
  Users, 
  Clock, 
  MapPin, 
  ArrowUpRight, 
  Percent,
  FileCheck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

export const ManagementDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<any>({
    totalViolations: 0,
    totalChallans: 0,
    collectionRate: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    pendingAppeals: 0,
    overdueChallans: 0
  });

  const [repeatOffenders, setRepeatOffenders] = useState<any[]>([]);
  const [unpaidFines, setUnpaidFines] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [monthlyCollection, setMonthlyCollection] = useState<any[]>([]);
  const [appealsComparison, setAppealsComparison] = useState<any[]>([]);
  const [collectionEfficiency, setCollectionEfficiency] = useState<any[]>([]);
  const [licenseRisk, setLicenseRisk] = useState<any[]>([]);
  const [officerWorkload, setOfficerWorkload] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [
        kpiRes,
        repeatRes,
        unpaidRes,
        hotspotRes,
        monthlyRes,
        appealsRes,
        efficiencyRes,
        licenseRes,
        workloadRes
      ] = await Promise.all([
        fetch('/api/v1/analytics/kpis').then(r => r.json()),
        fetch('/api/v1/analytics/repeat-offenders').then(r => r.json()),
        fetch('/api/v1/analytics/unpaid-fines').then(r => r.json()),
        fetch('/api/v1/analytics/hotspots').then(r => r.json()),
        fetch('/api/v1/analytics/monthly-collection').then(r => r.json()),
        fetch('/api/v1/analytics/appeals-comparison').then(r => r.json()),
        fetch('/api/v1/analytics/collection-efficiency').then(r => r.json()),
        fetch('/api/v1/analytics/license-risk').then(r => r.json()),
        fetch('/api/v1/analytics/officer-workload').then(r => r.json())
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);
      if (repeatRes.success) setRepeatOffenders(repeatRes.data);
      if (unpaidRes.success) setUnpaidFines(unpaidRes.data);
      if (hotspotRes.success) setHotspots(hotspotRes.data);
      if (monthlyRes.success) setMonthlyCollection(monthlyRes.data);
      if (appealsRes.success) setAppealsComparison(appealsRes.data);
      if (efficiencyRes.success) setCollectionEfficiency(efficiencyRes.data);
      if (licenseRes.success) setLicenseRisk(licenseRes.data);
      if (workloadRes.success) setOfficerWorkload(workloadRes.data);
    } catch (e) {
      console.warn('Analytics loading error:', e);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="w-7 h-7 text-amber-500" />
            <span>Executive Traffic Intelligence Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time decision intelligence aggregated from MySQL 8 analytical queries and trigger audit logs.
          </p>
        </div>

        <button
          onClick={fetchAllAnalytics}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
        >
          Refresh Live SQL
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Violations Logged</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.totalViolations}</span>
          <p className="text-[10px] text-emerald-500 font-semibold flex items-center">
            <ArrowUpRight className="w-3 h-3" />
            <span>All ANPR points active</span>
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Challans Issued</span>
            <FileCheck className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.totalChallans}</span>
          <p className="text-[10px] text-slate-400">Via sp_generate_challan</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Settlement Rate</span>
            <Percent className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{kpis.collectionRate}%</span>
          <p className="text-[10px] text-slate-400">Paid / Demanded Ratio</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Total Collected</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            ₹{parseFloat(kpis.totalCollected || 0).toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-400 font-mono">Via sp_process_payment</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Outstanding Fines</span>
            <Clock className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-2xl font-black text-amber-500">
            ₹{parseFloat(kpis.totalOutstanding || 0).toLocaleString()}
          </span>
          <p className="text-[10px] text-red-500 font-semibold">{kpis.overdueChallans} Overdue Surcharges</p>
        </div>

      </div>

      {/* Row 1 Charts: Monthly Collection Running Cumulative & Collection Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Monthly Collection with Running Cumulative Total (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Query 4: Monthly Revenue & Running Cumulative Total (INR)</span>
            </h3>
            <p className="text-xs text-slate-500">Window function: SUM(monthly_amount) OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyCollection}>
                <defs>
                  <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month_label" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="monthly_amount" stroke="#10b981" fillOpacity={1} fill="url(#colorMonthly)" name="Monthly Collection" />
                <Line type="monotone" dataKey="running_total" stroke="#f59e0b" strokeWidth={2} name="Cumulative Running Total" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collection Efficiency per Violation Type (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Query 6: Collection Efficiency by Offense %
            </h3>
            <p className="text-xs text-slate-500">Statutory fine recovery percentage per infraction category</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionEfficiency} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="code" width={80} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Collection Efficiency']} />
                <Bar dataKey="collection_efficiency_percentage" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Violation Hotspots Leaflet Map & Ranked Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-red-500" />
            <span>Query 3: Geographical Violation Hotspots & Interactive Map</span>
          </h3>
          <p className="text-xs text-slate-500">High-density radar surveillance junctions ranked by critical violations and revenue</p>
        </div>

        {/* Leaflet Map */}
        <HotspotMap hotspots={hotspots} />

        {/* Hotspots Ranked Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="py-2.5 px-4">Area</th>
                <th className="py-2.5 px-4">Junction</th>
                <th className="py-2.5 px-4">Zone Type</th>
                <th className="py-2.5 px-4">Camera ID</th>
                <th className="py-2.5 px-4 text-center">Total Violations</th>
                <th className="py-2.5 px-4 text-center">Critical (Alcohol/WrongWay)</th>
                <th className="py-2.5 px-4 text-right">Fines Levied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {hotspots.map(h => (
                <tr key={h.location_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{h.area_name}</td>
                  <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{h.junction_name}</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{h.zone_type}</td>
                  <td className="py-2.5 px-4 font-mono text-amber-500">{h.camera_id}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-red-600">{h.total_violations}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-amber-600">{h.critical_violations}</td>
                  <td className="py-2.5 px-4 text-right font-bold">₹{parseFloat(String(h.total_fines_generated || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Repeat Offenders & High Unpaid Defaulters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Repeat Offenders Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Car className="w-4 h-4 text-amber-500" />
              <span>Query 1: Habitual Repeat Offenders (&gt;=2 violations / 6 mos)</span>
            </h3>
            <p className="text-xs text-slate-500">Grouped by registration number with cumulative fines</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-2 px-3">Vehicle</th>
                  <th className="py-2 px-3">Owner</th>
                  <th className="py-2 px-3 text-center">Count</th>
                  <th className="py-2 px-3 text-right">Total Incurred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {repeatOffenders.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">{r.registration_no}</td>
                    <td className="py-2 px-3 font-sans">{r.owner_name}</td>
                    <td className="py-2 px-3 text-center font-bold text-red-600">{r.total_violations_count}</td>
                    <td className="py-2 px-3 text-right font-bold">₹{parseFloat(r.total_fine_incurred).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* License Risk Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Query 7: License Risk (Suspended / Expired Drivers)</span>
            </h3>
            <p className="text-xs text-slate-500">Operating moving vehicle while license is not active</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="py-2 px-3">Driver Name</th>
                  <th className="py-2 px-3">License No</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Points</th>
                  <th className="py-2 px-3">Infraction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                {licenseRisk.map((l, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 font-semibold">{l.driver_name}</td>
                    <td className="py-2 px-3 font-mono text-blue-500">{l.license_number}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-800">
                        {l.license_status}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-red-600">{l.points_demerit}</td>
                    <td className="py-2 px-3 text-slate-500 truncate max-w-[120px]">{l.violation_committed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Row 4: Officer Workload View */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span>Query 8: Officer Workload & Productivity (From View v_officer_workload)</span>
          </h3>
          <p className="text-xs text-slate-500">Direct SQL view invocation tracking officer enforcement activity</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="py-2.5 px-4">Officer Name</th>
                <th className="py-2.5 px-4">Badge Number</th>
                <th className="py-2.5 px-4">Police Station</th>
                <th className="py-2.5 px-4 text-center">Violations Logged</th>
                <th className="py-2.5 px-4 text-center">Challans Issued</th>
                <th className="py-2.5 px-4 text-right">Fines Levied</th>
                <th className="py-2.5 px-4 text-right">Collected (PAID)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {officerWorkload.map(ow => (
                <tr key={ow.officer_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{ow.officer_name}</td>
                  <td className="py-2.5 px-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{ow.badge_number}</td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{ow.police_station}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-amber-600">{ow.total_violations_recorded}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-emerald-600">{ow.challans_generated}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold">₹{parseFloat(ow.total_fines_levied).toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600">₹{parseFloat(ow.total_fines_collected).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
