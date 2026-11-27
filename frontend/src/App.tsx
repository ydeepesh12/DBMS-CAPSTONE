import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ChallanDetailPage } from './pages/ChallanDetailPage';
import { LoginPage } from './pages/LoginPage';
import { OfficerPortal } from './pages/OfficerPortal';
import { PaymentAdminPortal } from './pages/PaymentAdminPortal';
import { AppealOfficerPortal } from './pages/AppealOfficerPortal';
import { TrafficAdminPortal } from './pages/TrafficAdminPortal';
import { ManagementDashboard } from './pages/ManagementDashboard';
import { EvidenceAnalyticsPage } from './pages/EvidenceAnalyticsPage';
import { DbmsLabPage } from './pages/DbmsLabPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  allowedRoles: string[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500">
        Verifying user credentials...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-3">
        <h2 className="text-xl font-bold text-red-600">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Your current role (<span className="font-bold">{user.role}</span>) does not have clearance for this operational section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Citizen & Search Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/challan/:challanId" element={<ChallanDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* DBMS Lab Viva Demo */}
              <Route path="/dbms-lab" element={<DbmsLabPage />} />

              {/* Officer Portal */}
              <Route
                path="/officer"
                element={
                  <ProtectedRoute allowedRoles={['OFFICER', 'TRAFFIC_ADMIN']}>
                    <OfficerPortal />
                  </ProtectedRoute>
                }
              />

              {/* Payment Admin Portal */}
              <Route
                path="/payments"
                element={
                  <ProtectedRoute allowedRoles={['PAYMENT_ADMIN', 'TRAFFIC_ADMIN']}>
                    <PaymentAdminPortal />
                  </ProtectedRoute>
                }
              />

              {/* Appeals Officer Portal */}
              <Route
                path="/appeals"
                element={
                  <ProtectedRoute allowedRoles={['APPEAL_OFFICER', 'TRAFFIC_ADMIN']}>
                    <AppealOfficerPortal />
                  </ProtectedRoute>
                }
              />

              {/* Traffic Master Admin Portal */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['TRAFFIC_ADMIN']}>
                    <TrafficAdminPortal />
                  </ProtectedRoute>
                }
              />

              {/* Management Dashboards */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['MANAGEMENT', 'TRAFFIC_ADMIN']}>
                    <ManagementDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/evidence-ai"
                element={
                  <ProtectedRoute allowedRoles={['MANAGEMENT', 'TRAFFIC_ADMIN']}>
                    <EvidenceAnalyticsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};
