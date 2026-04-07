// src/pages/AuthShared.js
// Shared layout, constants, and tiny components used by LoginPage and RegisterPage.

import React from 'react';

// Zorvyn swoosh logo for auth pages
function ZorvynLogoAuth({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 38 C25 20, 55 18, 78 30 C60 22, 35 26, 28 42 Z" fill="#0d4a42"/>
      <path d="M85 62 C75 80, 45 82, 22 70 C40 78, 65 74, 72 58 Z" fill="#0d4a42"/>
    </svg>
  );
}

// ── Role metadata used on both pages ──────────────────────────────────────────
export const ROLE_INFO = [
  {
    role: 'Admin',
    icon: '🛡️',
    color: { bg: 'var(--purple-dim)', text: 'var(--purple)' },
    perms: 'Full access — manage records & users',
    detail: 'Create, edit, delete records. Manage all users and their roles.',
  },
  {
    role: 'Analyst',
    icon: '📈',
    color: { bg: 'var(--accent-dim)', text: 'var(--accent)' },
    perms: 'View + create financial records',
    detail: 'Add new income and expense entries. View all reports and analytics.',
  },
  {
    role: 'Viewer',
    icon: '👁️',
    color: { bg: 'var(--green-dim)', text: 'var(--green)' },
    perms: 'Read-only dashboard access',
    detail: 'View dashboard, charts, and records. Cannot modify any data.',
  },
];

const FEATURES = [
  { icon: '📊', title: 'Live analytics', desc: 'Income vs expense trends, category breakdowns, net balance KPIs.' },
  { icon: '🔒', title: 'Role-based access', desc: 'Admins, analysts, and viewers each see exactly what they need.' },
  { icon: '📋', title: 'Full record management', desc: 'Create, filter, update, and soft-delete financial entries.' },
];

// ── Two-column layout ──────────────────────────────────────────────────────────
export function AuthLayout({ heading, sub, children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>

      {/* ── Left decorative panel ── */}
      <div
        className="auth-panel"
        style={{
          width: 400, flexShrink: 0,
          background: 'var(--bg2)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'flex-start', justifyContent: 'center',
          padding: '48px 40px',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52 }}>
          <div style={{
            width: 42, height: 42,
            background: '#e8f2f0',
            borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ZorvynLogoAuth size={26} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Zorvyn</span>
        </div>

        {/* Feature list */}
        <p style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 22 }}>
          What's inside
        </p>
        {FEATURES.map(({ icon, title, desc }) => (
          <div key={title} style={{ display: 'flex', gap: 14, marginBottom: 24, width: '100%' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', flexShrink: 0,
            }}>{icon}</div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 3 }}>{title}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text2)', lineHeight: 1.55 }}>{desc}</p>
            </div>
          </div>
        ))}

        {/* Bottom tag */}
        <div style={{ marginTop: 'auto', paddingTop: 40 }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
            Zorvyn · Finance Dashboard · Internship Assessment
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '48px 32px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 6 }}>
            {heading}
          </h1>
          <p style={{ color: 'var(--text2)', marginBottom: 34, fontSize: '0.9rem' }}>{sub}</p>
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) { .auth-panel { display: none !important; } }
      `}</style>
    </div>
  );
}

// ── Tiny reusable pieces ───────────────────────────────────────────────────────

export function FieldIcon({ path: iconName }) {
  const icons = {
    email: (
      <>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </>
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
      </>
    ),
    user: (
      <>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </>
    ),
  };
  return (
    <svg
      width="16" height="16" fill="none"
      stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
      style={{
        position: 'absolute', left: 12, top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text3)', pointerEvents: 'none',
      }}
    >
      {icons[iconName]}
    </svg>
  );
}

export function ErrIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

export function BtnSpinner() {
  return (
    <span style={{
      width: 14, height: 14,
      border: '2px solid rgba(255,255,255,0.35)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}
