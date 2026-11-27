import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, LogIn, Key, User, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('officer_vikram');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const demoAccounts: { role: UserRole; username: string; label: string; desc: string }[] = [
    { role: 'OFFICER', username: 'officer_vikram', label: 'Traffic Officer', desc: 'Capture violations & ANPR evidence' },
    { role: 'PAYMENT_ADMIN', username: 'payment_admin', label: 'Payment Admin', desc: 'Process counter payments & run late fees' },
    { role: 'APPEAL_OFFICER', username: 'appeal_kavita', label: 'Appeals Officer', desc: 'Adjudicate citizen appeals' },
    { role: 'TRAFFIC_ADMIN', username: 'traffic_admin', label: 'Traffic Admin', desc: 'Full master-data CRUD & audit log' },
    { role: 'MANAGEMENT', username: 'management_lead', label: 'Management', desc: 'Read-only analytics dashboards' },
    { role: 'OWNER', username: 'citizen_aarav', label: 'Registered Citizen', desc: 'View vehicle challans & receipts' }
  ];

  const handleLogin = async (uname: string = username, pwd: string = password) => {
    setLoading(true);
    setErrorMsg(null);

    const res = await login(uname, pwd);
    setLoading(false);

    if (res.success) {
      if (uname === 'officer_vikram') navigate('/officer');
      else if (uname === 'payment_admin') navigate('/payments');
      else if (uname === 'appeal_kavita') navigate('/appeals');
      else if (uname === 'traffic_admin') navigate('/admin');
      else if (uname === 'management_lead') navigate('/analytics');
      else navigate('/');
    } else {
      setErrorMsg(res.error || 'Invalid username or password. Please verify credentials.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-bold flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Sign In to SmartChallan
        </h1>
        <p className="text-xs text-slate-500">
          Role-Based Access Control (RBAC) Authenticated Portal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Login Form */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In with Credentials'}</span>
            </button>
          </form>
        </div>

        {/* 1-Click Role Switcher Demo Cards */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>INSTANT DEMO EVALUATION (1-CLICK LOGIN)</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {demoAccounts.map(demo => (
              <button
                key={demo.role}
                onClick={() => {
                  setUsername(demo.username);
                  setPassword('password123');
                  handleLogin(demo.username, 'password123');
                }}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-slate-800/80 transition text-left flex items-center justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      {demo.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {demo.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {demo.desc}
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center transition">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
