import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ViolationType, LocationRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { 
  ShieldAlert, 
  Search, 
  Camera, 
  Upload, 
  MapPin, 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  UserCheck, 
  FilePlus, 
  ListFilter
} from 'lucide-react';

const FALLBACK_VIOLATION_TYPES: ViolationType[] = [
  { violation_type_id: 1, code: 'V-SPEED-01', title: 'Overspeeding (>20 km/h over limit)', section_act: 'Section 112/183 Motor Vehicles Act', base_fine: '2000.00', late_fee_rate: '0.10', demerit_points: 3, severity: 'HIGH' },
  { violation_type_id: 2, code: 'V-RED-01', title: 'Red Light Jumping / Signal Violation', section_act: 'Section 119/177 Motor Vehicles Act', base_fine: '1000.00', late_fee_rate: '0.05', demerit_points: 2, severity: 'MEDIUM' },
  { violation_type_id: 3, code: 'V-HELM-01', title: 'Driving Without Certified Helmet', section_act: 'Section 129/194D Motor Vehicles Act', base_fine: '1000.00', late_fee_rate: '0.05', demerit_points: 1, severity: 'MEDIUM' },
  { violation_type_id: 4, code: 'V-BELT-01', title: 'Failure to Wear Seat Belt', section_act: 'Section 138(3)/177 Motor Vehicles Act', base_fine: '1000.00', late_fee_rate: '0.05', demerit_points: 1, severity: 'MEDIUM' },
  { violation_type_id: 5, code: 'V-PHONE-01', title: 'Using Mobile Phone While Driving', section_act: 'Section 184(c) Motor Vehicles Act', base_fine: '5000.00', late_fee_rate: '0.15', demerit_points: 4, severity: 'HIGH' },
  { violation_type_id: 6, code: 'V-LANE-01', title: 'Driving Against One-Way / Wrong Lane', section_act: 'Section 119/177 Motor Vehicles Act', base_fine: '1500.00', late_fee_rate: '0.10', demerit_points: 2, severity: 'MEDIUM' },
  { violation_type_id: 7, code: 'V-PARK-01', title: 'Improper Parking / Obstruction', section_act: 'Section 122/177 Motor Vehicles Act', base_fine: '500.00', late_fee_rate: '0.05', demerit_points: 0, severity: 'LOW' },
  { violation_type_id: 8, code: 'V-DRUNK-01', title: 'Drunk Driving / Intoxicated Operation', section_act: 'Section 185 Motor Vehicles Act', base_fine: '10000.00', late_fee_rate: '0.25', demerit_points: 6, severity: 'CRITICAL' }
];

const FALLBACK_LOCATIONS: LocationRecord[] = [
  { location_id: 1, area_name: 'Connaught Place Outer Circle', junction_name: 'Radial Road 2 Entry', latitude: '28.6328000', longitude: '77.2197000', speed_limit: 50, camera_id: 'CAM-DEL-CP-01', zone_type: 'COMMERCIAL' },
  { location_id: 2, area_name: 'Dhaula Kuan Intersection', junction_name: 'Ring Road Flyover Underpass', latitude: '28.5921000', longitude: '77.1563000', speed_limit: 60, camera_id: 'CAM-DEL-DK-02', zone_type: 'HIGHWAY' },
  { location_id: 3, area_name: 'Bandra West', junction_name: 'Linking Road - Turner Road Crossing', latitude: '19.0596000', longitude: '72.8295000', speed_limit: 40, camera_id: 'CAM-MUM-BW-02', zone_type: 'COMMERCIAL' },
  { location_id: 4, area_name: 'Western Express Highway', junction_name: 'Andheri Flyover Southbound', latitude: '19.1136000', longitude: '72.8697000', speed_limit: 70, camera_id: 'CAM-MUM-WEH-01', zone_type: 'HIGHWAY' },
  { location_id: 5, area_name: 'Indiranagar 100ft Road', junction_name: '12th Main Junction', latitude: '12.9719000', longitude: '77.6412000', speed_limit: 50, camera_id: 'CAM-BLR-IN-03', zone_type: 'COMMERCIAL' },
  { location_id: 6, area_name: 'Silk Board Junction', junction_name: 'Hosur Road Entry Ramp', latitude: '12.9177000', longitude: '77.6238000', speed_limit: 40, camera_id: 'CAM-BLR-SB-01', zone_type: 'INTERSECTION' },
  { location_id: 7, area_name: 'CyberHub Approach', junction_name: 'DLF Phase 2 Cyber City', latitude: '28.4950000', longitude: '77.0895000', speed_limit: 50, camera_id: 'CAM-GGN-CH-04', zone_type: 'COMMERCIAL' }
];

export const OfficerPortal: React.FC = () => {
  const { user } = useAuth();

  // Wizard state
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [vehicleResults, setVehicleResults] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  // Dropdown master data with reliable initial state
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>(FALLBACK_VIOLATION_TYPES);
  const [locations, setLocations] = useState<LocationRecord[]>(FALLBACK_LOCATIONS);
  const [selectedViolationType, setSelectedViolationType] = useState<ViolationType | null>(FALLBACK_VIOLATION_TYPES[0]);
  const [selectedLocation, setSelectedLocation] = useState<LocationRecord | null>(FALLBACK_LOCATIONS[0]);

  const [speedRecorded, setSpeedRecorded] = useState('');
  const [remarks, setRemarks] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // My recorded violations & workload
  const [workload, setWorkload] = useState<{ stats: any; violations: any[] }>({ stats: null, violations: [] });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch master data & workload on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const res = await fetch('/api/v1/officers/master-data', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setMessage({ type: 'error', text: data.error || 'Unable to load violation types and locations.' });
          return;
        }

        setViolationTypes(data.data.violationTypes);
        setLocations(data.data.locations);
        if (data.data.violationTypes.length > 0) setSelectedViolationType(data.data.violationTypes[0]);
        if (data.data.locations.length > 0) setSelectedLocation(data.data.locations[0]);
      } catch (error) {
        console.warn('Error fetching officer master data:', error);
        setMessage({ type: 'error', text: 'Unable to connect to the server while loading violation types and locations.' });
      }
    };

    fetchMasterData();
    fetchWorkload();
  }, []);

  const fetchWorkload = async () => {
    try {
      const res = await fetch('/api/v1/officers/my-workload', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.error || 'Unable to load your recorded violations.' });
        return;
      }
      setWorkload(data.data);
    } catch (error) {
      console.warn('Error fetching workload:', error);
      setMessage({ type: 'error', text: 'Unable to connect to the server while loading your recorded violations.' });
    }
  };

  // Search vehicle with live warning for SUSPENDED / EXPIRED
  const handleVehicleSearch = async (val: string) => {
    setVehicleQuery(val);
    if (val.trim().length < 2) {
      setVehicleResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/v1/officers/vehicles/search?q=${encodeURIComponent(val)}`, { credentials: 'include' });
      const d = await res.json();
      if (d.success) setVehicleResults(d.data);
    } catch (e) {
      console.warn('Vehicle search error:', e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidenceFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmitViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedViolationType || !selectedLocation) {
      setMessage({ type: 'error', text: 'Please select a vehicle, violation type, and location.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('vehicleId', String(selectedVehicle.vehicle_id));
    if (selectedVehicle.driver_id) formData.append('driverId', String(selectedVehicle.driver_id));
    formData.append('violationTypeId', String(selectedViolationType.violation_type_id));
    formData.append('locationId', String(selectedLocation.location_id));
    if (speedRecorded) formData.append('speedRecorded', speedRecorded);
    formData.append('remarks', remarks || 'Officer field capture');
    formData.append('autoGenerateChallan', String(autoGenerate));
    if (evidenceFile) formData.append('evidenceFile', evidenceFile);

    try {
      const res = await fetch('/api/v1/officers/violations', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.error || 'Failed to record violation.' });
      } else {
        setMessage({ type: 'success', text: data.data.message });
        // Reset form
        setSelectedVehicle(null);
        setVehicleQuery('');
        setSpeedRecorded('');
        setRemarks('');
        setEvidenceFile(null);
        setPreviewUrl(null);
        fetchWorkload();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateChallan = async (violationId: number) => {
    try {
      const res = await fetch('/api/v1/officers/generate-challan', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ violationId })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Challan generated successfully via sp_generate_challan' });
        fetchWorkload();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate challan.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Officer Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black">Officer Enforcement Terminal</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">FIELD ACTIVE</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Officer: {user?.officer?.name || user?.username} • Badge: #{user?.officer?.badge_number || 'TP-DEL-1042'} • Station: {user?.officer?.police_station || 'Connaught Place Station'}
            </p>
          </div>
        </div>

        {workload.stats && (
          <div className="flex items-center space-x-6 text-center bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/60">
            <div>
              <span className="text-lg font-black text-amber-400">{workload.stats.total_violations_recorded}</span>
              <p className="text-[10px] text-slate-400">Recorded</p>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div>
              <span className="text-lg font-black text-emerald-400">{workload.stats.challans_generated}</span>
              <p className="text-[10px] text-slate-400">Challans</p>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div>
              <span className="text-lg font-black text-white">₹{parseFloat(workload.stats.total_fines_levied || 0).toLocaleString()}</span>
              <p className="text-[10px] text-slate-400">Total Levied</p>
            </div>
          </div>
        )}
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

      {/* Grid: Record Violation Wizard on Left, My Violations on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Record Violation Form Wizard (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <FilePlus className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record New Traffic Infraction</h2>
          </div>

          <form onSubmit={handleSubmitViolation} className="space-y-5">
            
            {/* Step 1: Vehicle Autocomplete & License Status Warning */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Vehicle Registration Number Autocomplete *
              </label>
              
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={vehicleQuery}
                  onChange={e => handleVehicleSearch(e.target.value.toUpperCase())}
                  placeholder="Type Registration No (e.g. DL01AB, MH02, KA03)..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-wider font-semibold"
                />
              </div>

              {/* Suggestions dropdown */}
              {vehicleResults.length > 0 && !selectedVehicle && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg divide-y divide-slate-100 dark:divide-slate-700/50 max-h-48 overflow-y-auto z-20">
                  {vehicleResults.map(v => (
                    <button
                      key={v.vehicle_id}
                      type="button"
                      onClick={() => {
                        setSelectedVehicle(v);
                        setVehicleQuery(v.registration_no);
                        setVehicleResults([]);
                      }}
                      className="w-full p-2.5 text-left text-xs hover:bg-amber-50 dark:hover:bg-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{v.registration_no}</span>
                        <span className="text-slate-500 ml-2">({v.make_model})</span>
                        <p className="text-[11px] text-slate-400">Owner: {v.owner_name} • Phone: {v.owner_phone}</p>
                      </div>

                      {v.hasRiskWarning && (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300">
                          RISK ALERT
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Vehicle Warning Box */}
              {selectedVehicle && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">Selected: {selectedVehicle.registration_no}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedVehicle(null)}
                      className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]"
                    >
                      Change Vehicle
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedVehicle.make_model} • Owner: {selectedVehicle.owner_name} ({selectedVehicle.owner_phone})
                  </p>

                  {/* Statutory Risk Warnings */}
                  {selectedVehicle.hasRiskWarning && (
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs space-y-1 text-red-700 dark:text-red-300">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span>Enforcement Risk Notice:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                        {selectedVehicle.riskWarnings.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Violation Type with Base Fine preview */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Violation Type & Statutory Section *
              </label>
              <select
                value={selectedViolationType?.violation_type_id || ''}
                onChange={e => {
                  const vt = violationTypes.find(v => v.violation_type_id === parseInt(e.target.value, 10));
                  setSelectedViolationType(vt || null);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                {violationTypes.map(vt => (
                  <option key={vt.violation_type_id} value={vt.violation_type_id}>
                    {vt.title} — ₹{parseFloat(String(vt.base_fine)).toFixed(2)} ({vt.section_act})
                  </option>
                ))}
              </select>

              {selectedViolationType && (
                <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-amber-900 dark:text-amber-200">{selectedViolationType.section_act}</span>
                    <p className="text-[11px] text-slate-500">Demerit Points: {selectedViolationType.demerit_points} • Severity: {selectedViolationType.severity}</p>
                  </div>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">
                    ₹{parseFloat(String(selectedViolationType.base_fine)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Step 3: Location Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                3. Enforcement Location & Radar Camera Junction *
              </label>
              <select
                value={selectedLocation?.location_id || ''}
                onChange={e => {
                  const loc = locations.find(l => l.location_id === parseInt(e.target.value, 10));
                  setSelectedLocation(loc || null);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              >
                {locations.map(loc => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.area_name} — {loc.junction_name} (Speed Limit: {loc.speed_limit} km/h)
                  </option>
                ))}
              </select>
            </div>

            {/* Speed recorded (Optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Speed Recorded (km/h)
                </label>
                <input
                  type="number"
                  value={speedRecorded}
                  onChange={e => setSpeedRecorded(e.target.value)}
                  placeholder="e.g. 78"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Officer Field Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g. Handheld radar detection"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Step 4: Evidence File Upload (Multer + Mongo + MySQL) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                4. Photographic Radar / ANPR Evidence Upload
              </label>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-amber-500 transition cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {evidenceFile ? evidenceFile.name : 'Click or drop violation camera snapshot'}
                </p>
                <p className="text-[10px] text-slate-400">JPG, PNG, WebP up to 25MB. Synchronized with MongoDB metadata collection.</p>
              </div>

              {previewUrl && (
                <div className="mt-2 w-32 h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Checkbox: Auto-issue Challan via sp_generate_challan */}
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={e => setAutoGenerate(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="font-bold">Immediately Trigger Challan Generation (CALL sp_generate_challan)</span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 shadow-md shadow-amber-500/10 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{submitting ? 'Recording & Generating...' : 'Submit & Register Violation'}</span>
            </button>

          </form>
        </div>

        {/* My Recorded Violations Table (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <ListFilter className="w-4 h-4 text-blue-500" />
              <span>Recent Enforcements ({workload.violations.length})</span>
            </h3>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {workload.violations.map((v: any) => (
              <div
                key={v.violation_id}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{v.registration_no}</span>
                    <span className="text-slate-400 text-[11px] ml-1.5">{v.make_model}</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{v.violation_title}</p>
                  </div>
                  {v.challan_status ? (
                    <StatusBadge status={v.challan_status} />
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      LOGGED
                    </span>
                  )}
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{v.junction_name}</span>
                  <span>{v.violation_timestamp}</span>
                </div>

                {/* Action button if challan not yet generated */}
                {!v.challan_id && v.violation_status === 'LOGGED' && (
                  <button
                    onClick={() => handleGenerateChallan(v.violation_id)}
                    className="w-full mt-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition"
                  >
                    Generate Challan (sp_generate_challan)
                  </button>
                )}

                {v.challan_number && (
                  <div className="pt-1 border-t border-slate-200 dark:border-slate-700/60 flex justify-between text-[11px]">
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{v.challan_number}</span>
                    <span className="font-bold">₹{parseFloat(v.total_amount).toFixed(2)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
