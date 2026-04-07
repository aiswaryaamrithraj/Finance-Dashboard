// src/contexts/AuthContext.js
// React Context provides a way to pass data through the component tree
// without having to pass props down manually at every level.
// Here we store the logged-in user globally so any component can access it.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize from localStorage so the user stays logged in on page refresh
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // On first load, verify the stored token is still valid
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => setUser(data.data.user))
        .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token, user: userData } = data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    const { token, user: userData } = data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Convenience helpers
  const isAdmin   = user?.role === 'admin';
  const isAnalyst = user?.role === 'analyst';
  const canWrite  = isAdmin || isAnalyst;   // Can create records
  const canDelete = isAdmin;                // Can delete records & manage users

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isAnalyst, canWrite, canDelete }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — cleaner than writing useContext(AuthContext) every time
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
