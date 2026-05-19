'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, ApiResponse } from '@/types';
import { api } from '@/lib/api';

interface AuthCtx {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'customer' | 'brand') => Promise<void>;
  logout: () => void;
  updateUser: (nextUser: User) => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const restore = useCallback(async () => {
    const t = localStorage.getItem('token');
    if (!t) { setLoading(false); return; }
    setToken(t);
    try {
      const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
      setUser(res.data.user);
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { restore(); }, [restore]);

  const login = async (email: string, password: string) => {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (name: string, email: string, password: string, role: 'customer' | 'brand') => {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', { name, email, password, role });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const updateUser = useCallback((nextUser: User) => {
    setUser(nextUser);
  }, []);

  const logout = () => {
    api.post('/auth/logout', {}).catch(() => { });
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
