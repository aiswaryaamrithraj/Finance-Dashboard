// src/utils/api.js
// Axios instance that talks directly to the backend.
// Using an explicit baseURL is more reliable than the CRA proxy
// because the proxy can silently fail when the backend isn't running yet.

import axios from 'axios';

// Determine the API base URL:
// - In development (npm start): backend runs on port 5000
// - In production (npm run build): serve frontend from the same server
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000/api'
    : '/api');

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request Interceptor ──────────────────────────────────────────────────────
// Attach the JWT token to every outgoing request automatically.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────────────────────
// Handle token expiry globally — log out and redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No response at all = backend is down
    if (!error.response) {
      error.message =
        'Cannot reach the server. Make sure the backend is running on port 5000.\n\nRun: cd backend && npm run dev';
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
