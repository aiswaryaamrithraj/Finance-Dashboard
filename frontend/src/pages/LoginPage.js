// src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout, FieldIcon, ErrIcon, BtnSpinner, ROLE_INFO } from './AuthShared';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout heading="Welcome back" sub="Sign in to your Zorvyn account">
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ErrIcon /> {error}
          </div>
        )}

        {/* Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email address</label>
          <div style={{ position: 'relative' }}>
            <FieldIcon path="email" />
            <input
              id="login-email" name="email" type="email"
              className="form-control" style={{ paddingLeft: 40 }}
              placeholder="you@example.com"
              value={form.email} onChange={handleChange}
              autoComplete="email" required
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <div style={{ position: 'relative' }}>
            <FieldIcon path="lock" />
            <input
              id="login-password" name="password"
              type={showPw ? 'text' : 'password'}
              className="form-control" style={{ paddingLeft: 40, paddingRight: 44 }}
              placeholder="••••••••"
              value={form.password} onChange={handleChange}
              autoComplete="current-password" required
            />
            <button type="button" onClick={() => setShowPw(s => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}>
              <EyeIcon open={showPw} />
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}
          style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4, fontSize: '0.95rem' }}>
          {loading ? <><BtnSpinner /> Signing in…</> : 'Sign in →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 22, fontSize: '0.875rem', color: 'var(--text3)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
          Create one free
        </Link>
      </p>

      {/* Role reference */}
      <div style={{ marginTop: 28, borderTop: '1px solid var(--border)', paddingTop: 22 }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
          Role permissions at a glance
        </p>
        {ROLE_INFO.map(({ role, color, perms, icon }) => (
          <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
              {icon}
            </div>
            <span style={{ minWidth: 58, fontSize: '0.8rem', fontWeight: 600, color: color.text }}>{role}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{perms}</span>
          </div>
        ))}
      </div>
    </AuthLayout>
  );
}

function EyeIcon({ open }) {
  return open
    ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
