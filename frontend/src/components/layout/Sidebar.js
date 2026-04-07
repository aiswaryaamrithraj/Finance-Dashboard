// src/components/layout/Sidebar.js
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { capitalize } from '../../utils/format';

const Icon = ({ name }) => {
  const icons = {
    dashboard: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
    records: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/>
        <line x1="8" y1="17" x2="12" y2="17"/>
      </svg>
    ),
    users: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    logout: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
        <polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
  };
  return icons[name] || null;
};

// Zorvyn swoosh logo — two curved sweep shapes in dark teal
function ZorvynLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top swoosh — curves left to right upward */}
      <path
        d="M15 38 C25 20, 55 18, 78 30 C60 22, 35 26, 28 42 Z"
        fill="#0d4a42"
      />
      {/* Bottom swoosh — mirrors, curves right to left downward */}
      <path
        d="M85 62 C75 80, 45 82, 22 70 C40 78, 65 74, 72 58 Z"
        fill="#0d4a42"
      />
    </svg>
  );
}

export { ZorvynLogo };

const roleDot = { admin: '#a78bfa', analyst: '#4f8ef7', viewer: '#22c87a' };

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/',        label: 'Dashboard', icon: 'dashboard' },
    { to: '/records', label: 'Records',   icon: 'records' },
    ...(isAdmin ? [{ to: '/users', label: 'Users', icon: 'users' }] : []),
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      position: 'fixed',
      top: 0, left: 0,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Zorvyn swoosh logo */}
          <div style={{
            width: 36, height: 36,
            background: '#e8f2f0',
            borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ZorvynLogo size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>Zorvyn</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text3)', letterSpacing: '0.02em' }}>Finance Dashboard</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8,
              textDecoration: 'none',
              fontSize: '0.875rem', fontWeight: 500,
              color: isActive ? 'var(--accent)' : 'var(--text2)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              transition: 'all var(--transition)',
            })}
            onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'var(--bg3)'; }}
            onMouseLeave={e => { if (!e.currentTarget.style.background?.includes('accent-dim')) e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon name={icon} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          background: 'var(--bg3)', borderRadius: 10, padding: '12px',
          marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34,
              background: 'var(--accent-dim)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)',
              flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: roleDot[user?.role] }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{capitalize(user?.role)}</span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
          <Icon name="logout" /> Sign out
        </button>
      </div>
    </aside>
  );
}
