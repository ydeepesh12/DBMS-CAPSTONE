import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { 
  ShieldCheck, 
  Sun, 
  Moon, 
  LogIn, 
  LogOut, 
  Search, 
  FileText, 
  CreditCard, 
  AlertTriangle, 
  BarChart3, 
  Database, 
  Sliders, 
  Camera,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, switchRole, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles: { role: UserRole; label: string }[] = [
    { role: 'OFFICER', label: 'Traffic Officer' },
    { role: 'PAYMENT_ADMIN', label: 'Payment Admin' },
    { role: 'APPEAL_OFFICER', label: 'Appeals Officer' },
    { role: 'TRAFFIC_ADMIN', label: 'Traffic Admin' },
    { role: 'MANAGEMENT', label: 'Executive Management' },
    { role: 'OWNER', label: 'Citizen Portal' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">SmartChallan</span>
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">E-GOV</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">Traffic Violation & Challan DBMS</p>
            </div>
          </Link>

          {/* Navigation Links (Role Filtered) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link 
              to="/" 
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors"
            >
              <Search className="w-4 h-4 text-amber-500" />
              <span>Check & Pay</span>
            </Link>

            {/* Officer Links */}
            {user && (user.role === 'OFFICER' || user.role === 'TRAFFIC_ADMIN') && (
              <Link 
                to="/officer" 
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Officer Terminal</span>
              </Link>
            )}

            {/* Payment Admin Links */}
            {user && (user.role === 'PAYMENT_ADMIN' || user.role === 'TRAFFIC_ADMIN') && (
              <Link 
                to="/payments" 
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors"
              >
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>Payment Counter</span>
              </Link>
            )}

            {/* Appeal Officer Links */}
            {user && (user.role === 'APPEAL_OFFICER' || user.role === 'TRAFFIC_ADMIN') && (
              <Link 
                to="/appeals" 
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-purple-500" />
                <span>Appeals Queue</span>
              </Link>
            )}

            {/* Traffic Admin Links */}
            {user && user.role === 'TRAFFIC_ADMIN' && (
              <Link 
                to="/admin" 
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors"
              >
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>Master Admin</span>
              </Link>
            )}

            {/* Management / Analytics Links */}
            {user && (user.role === 'MANAGEMENT' || user.role === 'TRAFFIC_ADMIN') && (
              <>
                <Link 
                  to="/analytics" 
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  <span>Analytics</span>
                </Link>
                <Link 
                  to="/evidence-ai" 
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors"
                >
                  <Camera className="w-4 h-4 text-teal-500" />
                  <span>Evidence AI</span>
                </Link>
              </>
            )}

            {/* DBMS Lab Page (Always visible for viva test) */}
            <Link 
              to="/dbms-lab" 
              className="px-3 py-2 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 flex items-center space-x-1.5 border border-amber-500/20 transition-colors"
            >
              <Database className="w-4 h-4 text-amber-500" />
              <span>DBMS Lab Viva</span>
            </Link>
          </nav>

          {/* Right controls */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button 
                onClick={() => setRoleDropdownOpen(prev => !prev)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
              >
                <span>Role: {user ? user.role : 'Guest'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50">
                  <div className="px-3 py-1 border-b border-slate-100 dark:border-slate-700/50 text-[11px] font-semibold text-slate-400">
                    QUICK DEMO SWITCHER
                  </div>
                  {roles.map(r => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50 dark:hover:bg-slate-700 transition ${user?.role === r.role ? 'text-amber-600 font-bold bg-amber-50/50 dark:bg-slate-700/50' : 'text-slate-700 dark:text-slate-200'}`}
                    >
                      <span>{r.label}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{r.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Auth Action */}
            {user ? (
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 transition shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
