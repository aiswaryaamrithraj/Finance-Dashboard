// src/pages/RegisterPage.js
// Sign Up page — collects name, email, password, and role.
// Role selection shows a card for each option explaining what it allows.

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout, FieldIcon, ErrIcon, BtnSpinner, ROLE_INFO } from './AuthShared';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    name:     '',
    email:    '',
    password: '',
    confirm:  '',
    role:     '',          // Must be chosen — no default, forces a conscious pick
  });
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [errors,   setErrors]   = useState({});   // Field-level errors
  const [loading,  setLoading]  = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    // Clear the field error as the user types
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  // ── Password strength ──────────────────────────────────────────────────────
  const strength = useMemo(() => {
    const p = form.password;
    if (!p) return { score: 0, label: '', color: 'var(--border)' };
    let score = 0;
    if (p.length >= 8)               score++;
    if (/[A-Z]/.test(p))             score++;
    if (/[0-9]/.test(p))             score++;
    if (/[^A-Za-z0-9]/.test(p))      score++;
    const levels = [
      { score: 1, label: 'Weak',      color: 'var(--red)' },
      { score: 2, label: 'Fair',      color: 'var(--amber)' },
      { score: 3, label: 'Good',      color: '#3b82f6' },
      { score: 4, label: 'Strong',    color: 'var(--green)' },
    ];
    return levels[score - 1] || { score: 0, label: '', color: 'var(--border)' };
  }, [form.password]);

  // ── Client-side validation ─────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = 'Full name must be at least 2 characters.';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.';
    if (!form.password || form.password.length < 6)
      errs.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirm)
      errs.confirm = 'Passwords do not match.';
    if (!form.role)
      errs.role = 'Please select a role to continue.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register(form.name.trim(), form.email, form.password, form.role);
      navigate('/');
    } catch (err) {
      // Network error — backend not running
      if (!err.response) {
        setError('Cannot reach the server. Make sure the backend is running:\n  cd backend && npm run dev');
        setLoading(false);
        return;
      }
      const serverErrors = err.response?.data?.errors;
      if (serverErrors?.length) {
        const mapped = {};
        serverErrors.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout heading="Create your account" sub="Join Zorvyn — it only takes a minute">
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <ErrIcon />
            <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
          </div>
        )}

        {/* Full name */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-name">Full name</label>
          <div style={{ position: 'relative' }}>
            <FieldIcon path="user" />
            <input
              id="reg-name" name="name" type="text"
              className="form-control" style={{ paddingLeft: 40 }}
              placeholder="Alice Johnson"
              value={form.name} onChange={handleChange}
              autoComplete="name" autoFocus
            />
          </div>
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-email">Email address</label>
          <div style={{ position: 'relative' }}>
            <FieldIcon path="email" />
            <input
              id="reg-email" name="email" type="email"
              className="form-control" style={{ paddingLeft: 40 }}
              placeholder="alice@example.com"
              value={form.email} onChange={handleChange}
              autoComplete="email"
            />
          </div>
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-password">Password</label>
          <div style={{ position: 'relative' }}>
            <FieldIcon path="lock" />
            <input
              id="reg-password" name="password"
              type={showPw ? 'text' : 'password'}
              className="form-control" style={{ paddingLeft: 40, paddingRight: 44 }}
              placeholder="Min. 6 characters"
              value={form.password} onChange={handleChange}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPw(s => !s)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}>
              <EyeToggle open={showPw} />
            </button>
          </div>
          {/* Strength bar */}
          {form.password && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: i <= strength.score ? strength.color : 'var(--border)',
                    transition: 'background 0.25s',
                  }} />
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: strength.color }}>{strength.label}</p>
            </div>
          )}
          {errors.password && <span className="form-error">{errors.password}</span>}
        </div>

        {/* Confirm password */}
        <div className="form-group">
          <label className="form-label" htmlFor="reg-confirm">Confirm password</label>
          <div style={{ position: 'relative' }}>
            <FieldIcon path="lock" />
            <input
              id="reg-confirm" name="confirm"
              type={showPw ? 'text' : 'password'}
              className="form-control" style={{ paddingLeft: 40 }}
              placeholder="Repeat your password"
              value={form.confirm} onChange={handleChange}
              autoComplete="new-password"
            />
            {/* Match tick */}
            {form.confirm && form.password === form.confirm && (
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--green)' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
            )}
          </div>
          {errors.confirm && <span className="form-error">{errors.confirm}</span>}
        </div>

        {/* Role selection */}
        <div className="form-group">
          <label className="form-label">Your role <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span></label>
          <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 10 }}>
            Choose the role that matches your responsibilities in the system.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROLE_INFO.map(({ role, icon, color, detail }) => {
              const val     = role.toLowerCase();
              const checked = form.role === val;
              return (
                <label key={role}
                  htmlFor={`role-${val}`}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${checked ? color.text : 'var(--border)'}`,
                    background: checked ? color.bg : 'var(--bg3)',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Hidden radio input */}
                  <input
                    type="radio" id={`role-${val}`} name="role"
                    value={val} checked={checked}
                    onChange={handleChange}
                    style={{ position: 'absolute', opacity: 0, width: 0 }}
                  />

                  {/* Role icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: checked ? color.text : 'var(--bg2)',
                    border: `1px solid ${checked ? color.text : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', transition: 'all 0.15s',
                  }}>{icon}</div>

                  {/* Role info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: checked ? color.text : 'var(--text)' }}>
                        {role}
                      </span>
                      {checked && (
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 600, padding: '1px 7px',
                          background: color.text, color: 'var(--bg)', borderRadius: 20,
                        }}>Selected</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text2)', lineHeight: 1.5 }}>{detail}</p>
                  </div>

                  {/* Check indicator */}
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    border: `2px solid ${checked ? color.text : 'var(--border2)'}`,
                    background: checked ? color.text : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {checked && (
                      <svg width="10" height="10" fill="none" stroke="var(--bg)" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          {errors.role && <span className="form-error" style={{ marginTop: 4 }}>{errors.role}</span>}
        </div>

        {/* Terms note */}
        <p style={{ fontSize: '0.76rem', color: 'var(--text3)', lineHeight: 1.6 }}>
          By creating an account you confirm that all provided information is accurate and that you understand the permissions associated with your chosen role.
        </p>

        <button type="submit" className="btn btn-primary" disabled={loading}
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}>
          {loading ? <><BtnSpinner /> Creating account…</> : 'Create account →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 22, fontSize: '0.875rem', color: 'var(--text3)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

function EyeToggle({ open }) {
  return open
    ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
