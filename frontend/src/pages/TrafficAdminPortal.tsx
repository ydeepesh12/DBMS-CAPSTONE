import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Users, 
  Car, 
  FileBadge, 
  UserCheck, 
  MapPin, 
  AlertOctagon, 
  History, 
  Plus, 
  Trash2, 
  Edit, 
  ShieldCheck, 
  Search, 
  KeyRound
} from 'lucide-react';

type AdminTab = 'VEHICLES' | 'OWNERS' | 'DRIVERS' | 'OFFICERS' | 'VIOLATIONS' | 'LOCATIONS' | 'USERS' | 'AUDIT';

export const TrafficAdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('VEHICLES');
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [message, setMessage] = useState<string | null>(null);

  const endpointMap: Record<AdminTab, string> = {
    VEHICLES: '/api/v1/admin/vehicles',
    OWNERS: '/api/v1/admin/owners',
    DRIVERS: '/api/v1/admin/drivers',
    OFFICERS: '/api/v1/admin/officers',
    VIOLATIONS: '/api/v1/admin/violation-types',
    LOCATIONS: '/api/v1/admin/locations',
    USERS: '/api/v1/admin/users',
    AUDIT: '/api/v1/admin/audit-logs'
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(endpointMap[activeTab]);
      const json = await res.json();
      if (json.success) setDataList(json.data || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this record? Cascading constraints may apply.')) return;
    try {
      const url = `${endpointMap[activeTab]}/${id}`;
      const res = await fetch(url, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.error || 'Failed to delete');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(endpointMap[activeTab], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        setFormData({});
        fetchData();
      } else {
        alert(json.error || 'Operation failed');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold">
            <Sliders className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black">Traffic System Master Administration</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white">ROOT CRUD</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Full relational master-data lifecycle management, user authentication mapping, and database audit logs.
            </p>
          </div>
        </div>

        {activeTab !== 'AUDIT' && (
          <button
            onClick={() => {
              setFormData({});
              setModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New {activeTab.slice(0, -1)}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        {[
          { tab: 'VEHICLES', label: 'Vehicles', icon: Car },
          { tab: 'OWNERS', label: 'Owners', icon: Users },
          { tab: 'DRIVERS', label: 'Drivers & Licenses', icon: UserCheck },
          { tab: 'OFFICERS', label: 'Officers', icon: ShieldCheck },
          { tab: 'VIOLATIONS', label: 'Violation Rules', icon: AlertOctagon },
          { tab: 'LOCATIONS', label: 'Locations & Radars', icon: MapPin },
          { tab: 'USERS', label: 'App Users (RBAC)', icon: KeyRound },
          { tab: 'AUDIT', label: 'Audit Trail Ledger', icon: History }
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab as AdminTab)}
              className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition ${
                activeTab === item.tab
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Table Data View */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              {activeTab === 'VEHICLES' && (
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Registration No</th>
                  <th className="py-3 px-4">Make & Model</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Owner Name</th>
                  <th className="py-3 px-4">RC Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              )}

              {activeTab === 'OWNERS' && (
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">National ID (Aadhar)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              )}

              {activeTab === 'DRIVERS' && (
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Driver Name</th>
                  <th className="py-3 px-4">License Number</th>
                  <th className="py-3 px-4">License Status</th>
                  <th className="py-3 px-4">Demerit Points</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              )}

              {activeTab === 'OFFICERS' && (
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Badge Number</th>
                  <th className="py-3 px-4">Officer Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              )}

              {activeTab === 'VIOLATIONS' && (
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Motor Vehicles Section</th>
                  <th className="py-3 px-4">Base Fine (INR)</th>
                  <th className="py-3 px-4">Points</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              )}

              {activeTab === 'LOCATIONS' && (
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Area Name</th>
                  <th className="py-3 px-4">Junction</th>
                  <th className="py-3 px-4">Coordinates (Lat, Lng)</th>
                  <th className="py-3 px-4">Speed Limit</th>
                  <th className="py-3 px-4">Camera ID</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              )}

              {activeTab === 'USERS' && (
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Associated Officer / Owner</th>
                  <th className="py-3 px-4">Active</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              )}

              {activeTab === 'AUDIT' && (
                <tr>
                  <th className="py-3 px-4">Audit ID</th>
                  <th className="py-3 px-4">Challan No</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Old → New Status</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Executed By</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dataList.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  
                  {activeTab === 'VEHICLES' && (
                    <>
                      <td className="py-3 px-4 font-mono font-bold">#{row.vehicle_id}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{row.registration_no}</td>
                      <td className="py-3 px-4">{row.make_model}</td>
                      <td className="py-3 px-4">{row.vehicle_type}</td>
                      <td className="py-3 px-4">{row.owner_name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.rc_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {row.rc_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleDelete(row.vehicle_id)} className="p-1 text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}

                  {activeTab === 'OWNERS' && (
                    <>
                      <td className="py-3 px-4 font-mono">#{row.owner_id}</td>
                      <td className="py-3 px-4 font-bold">{row.name}</td>
                      <td className="py-3 px-4">{row.phone}</td>
                      <td className="py-3 px-4 text-slate-500">{row.email || 'N/A'}</td>
                      <td className="py-3 px-4 font-mono">{row.national_id}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleDelete(row.owner_id)} className="p-1 text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}

                  {activeTab === 'DRIVERS' && (
                    <>
                      <td className="py-3 px-4 font-mono">#{row.driver_id}</td>
                      <td className="py-3 px-4 font-bold">{row.name}</td>
                      <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400">{row.license_number}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.license_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {row.license_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold">{row.points_demerit}</td>
                      <td className="py-3 px-4">{row.phone}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleDelete(row.driver_id)} className="p-1 text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}

                  {activeTab === 'OFFICERS' && (
                    <>
                      <td className="py-3 px-4 font-mono">#{row.officer_id}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{row.badge_number}</td>
                      <td className="py-3 px-4 font-bold">{row.name}</td>
                      <td className="py-3 px-4">{row.designation}</td>
                      <td className="py-3 px-4">{row.police_station}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleDelete(row.officer_id)} className="p-1 text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}

                  {activeTab === 'VIOLATIONS' && (
                    <>
                      <td className="py-3 px-4 font-mono font-bold">{row.code}</td>
                      <td className="py-3 px-4 font-bold">{row.title}</td>
                      <td className="py-3 px-4 text-slate-500">{row.section_act}</td>
                      <td className="py-3 px-4 font-mono font-bold">₹{parseFloat(row.base_fine).toFixed(2)}</td>
                      <td className="py-3 px-4">{row.demerit_points}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {row.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleDelete(row.violation_type_id)} className="p-1 text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}

                  {activeTab === 'LOCATIONS' && (
                    <>
                      <td className="py-3 px-4 font-mono">#{row.location_id}</td>
                      <td className="py-3 px-4 font-bold">{row.area_name}</td>
                      <td className="py-3 px-4">{row.junction_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{row.latitude}, {row.longitude}</td>
                      <td className="py-3 px-4">{row.speed_limit} km/h</td>
                      <td className="py-3 px-4 font-mono text-purple-600 dark:text-purple-400">{row.camera_id || 'N/A'}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleDelete(row.location_id)} className="p-1 text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}

                  {activeTab === 'USERS' && (
                    <>
                      <td className="py-3 px-4 font-mono">#{row.user_id}</td>
                      <td className="py-3 px-4 font-bold">{row.username}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{row.role}</td>
                      <td className="py-3 px-4 text-slate-500">{row.officer_name || row.owner_name || 'System Level'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {row.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleDelete(row.user_id)} className="p-1 text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}

                  {activeTab === 'AUDIT' && (
                    <>
                      <td className="py-3 px-4 font-mono font-bold">#{row.audit_id}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-500">{row.challan_number}</td>
                      <td className="py-3 px-4 font-mono">{row.registration_no}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{row.action}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="text-slate-400">{row.old_status || 'NULL'}</span> → <span className="text-emerald-500">{row.new_status}</span>
                      </td>
                      <td className="py-3 px-4 font-bold">₹{parseFloat(row.new_amount).toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-500">{row.performed_by}</td>
                      <td className="py-3 px-4 text-slate-400 text-[10px]">{row.timestamp}</td>
                    </>
                  )}

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Dynamic Creation Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Create New {activeTab.slice(0, -1)}
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              
              {activeTab === 'OWNERS' && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Phone (+91-XXXXXXXXXX)"
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="National ID (e.g. AADHAR-XXXX-XXXX-XXXX)"
                    onChange={e => setFormData({ ...formData, national_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </>
              )}

              {activeTab === 'VEHICLES' && (
                <>
                  <input
                    type="text"
                    placeholder="Registration No (e.g. DL05AB9999)"
                    onChange={e => setFormData({ ...formData, registration_no: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Make & Model (e.g. Honda City ZX)"
                    onChange={e => setFormData({ ...formData, make_model: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                  <select
                    onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  >
                    <option value="CAR">CAR</option>
                    <option value="MOTORCYCLE">MOTORCYCLE</option>
                    <option value="TRUCK">TRUCK</option>
                    <option value="BUS">BUS</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Owner ID (e.g. 1)"
                    onChange={e => setFormData({ ...formData, owner_id: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Chassis No"
                    onChange={e => setFormData({ ...formData, chassis_no: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Engine No"
                    onChange={e => setFormData({ ...formData, engine_no: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </>
              )}

              {activeTab === 'USERS' && (
                <>
                  <input
                    type="text"
                    placeholder="Username"
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                  <select
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  >
                    <option value="OFFICER">OFFICER</option>
                    <option value="PAYMENT_ADMIN">PAYMENT_ADMIN</option>
                    <option value="APPEAL_OFFICER">APPEAL_OFFICER</option>
                    <option value="TRAFFIC_ADMIN">TRAFFIC_ADMIN</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 font-bold text-slate-950"
                >
                  Save Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
