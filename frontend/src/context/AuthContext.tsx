import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Check current session
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/v1/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUser(data.data);
          }
        }
      } catch (err) {
        console.warn('Session check warning:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const login = async (username: string, password: string = 'password123'): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.user) {
        setUser(data.data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed.' };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: 'Cannot connect to backend server on port 5000. Please run: npm run dev' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setUser(null);
    }
  };

  const switchRole = async (role: UserRole) => {
    const roleUsernameMap: Record<UserRole, string> = {
      OFFICER: 'officer_vikram',
      PAYMENT_ADMIN: 'payment_admin',
      APPEAL_OFFICER: 'appeal_kavita',
      TRAFFIC_ADMIN: 'traffic_admin',
      MANAGEMENT: 'management_lead',
      OWNER: 'citizen_aarav'
    };
    await login(roleUsernameMap[role], 'password123');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole, darkMode, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
