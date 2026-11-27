import React from 'react';
import { ShieldCheck, Phone, Mail, Globe, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span>SmartChallan System</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Integrated National Traffic Violation & Electronic Challan Settlement Portal. Built with automated ANPR cameras, stored procedures, and audit trail ledger.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Statutory Framework</h4>
            <ul className="space-y-2">
              <li>Section 133A Motor Vehicles Act, 1988</li>
              <li>Electronic Monitoring & Enforcement Rules 2021</li>
              <li>Central Motor Vehicle Rules (CMVR) 1989</li>
              <li>Digital Personal Data Protection (DPDP) 2023</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Enforcement Helplines</h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>Traffic Control Room: 1095 / 112</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>support@traffic.smartchallan.gov.in</span>
              </li>
              <li className="flex items-center space-x-2">
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>National Portal: echallan.parivahan.gov.in</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">DBMS Architecture</h4>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Database:</span>
                <span className="text-amber-400 font-mono">MySQL 8.0 + Mongo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transactions:</span>
                <span className="text-emerald-400 font-mono">ACID / Stored Procs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Audit Guard:</span>
                <span className="text-blue-400 font-mono">Triggers & Version</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
          <p>© 2026 Ministry of Road Transport & Highways. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Traffic Violation & Smart Challan Management System</p>
        </div>
      </div>
    </footer>
  );
};
