// src/pages/UsersPage.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, capitalize, roleBadgeClass } from '../utils/format';

function EditUserModal({ user, onClose, onSaved }) {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, role: user.role, status: user.status });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSelf = user.id === currentUser.id;

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put(`/users/${user.id}`, form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2 className="modal-title">Edit User</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input name="name" type="text" className="form-control" value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                <option value="viewer">Viewer — read only</option>
                <option value="analyst">Analyst — read + create</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>
            {!isSelf && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
            {isSelf && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
                You cannot deactivate your own account.
              </p>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteUser({ user, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/users/${user.id}`);
      onDeleted();
      onClose();
    } catch { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <h2 className="modal-title">Delete User?</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
          This will permanently delete <strong style={{ color: 'var(--text)' }}>{user.name}</strong> ({user.email}) and all their associated records.
        </p>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const [page, setPage]       = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const { data } = await api.get(`/users?${params}`);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (err) {
      console.error('fetchUsers error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [filters]);

  const handleFilterChange = (e) => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
  const openEdit   = (u) => { setSelected(u); setModal('edit'); };
  const openDelete = (u) => { setSelected(u); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">{pagination.total} total users</p>
        </div>
      </div>

      {/* Role explanation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { role: 'Viewer',  color: 'var(--green)',  desc: 'Can view dashboard and records. Cannot create, edit, or delete anything.' },
          { role: 'Analyst', color: 'var(--accent)', desc: 'Can view all data and create new financial records. Cannot delete or manage users.' },
          { role: 'Admin',   color: 'var(--purple)', desc: 'Full access. Can create, edit, delete records and manage all users.' },
        ].map(({ role, color, desc }) => (
          <div key={role} className="card card-sm" style={{ borderLeft: `3px solid ${color}` }}>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color, marginBottom: 4 }}>{role}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text2)', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar" style={{ marginBottom: 16 }}>
        <input name="search" className="form-control search-input" placeholder="Search by name or email…"
          value={filters.search} onChange={handleFilterChange} />
        <select name="role" className="form-control" value={filters.role} onChange={handleFilterChange}>
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="analyst">Analyst</option>
          <option value="viewer">Viewer</option>
        </select>
        <select name="status" className="form-control" value={filters.status} onChange={handleFilterChange}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state"><div>👤</div><p>No users found</p></div>
                </td></tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--accent-dim)', color: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: 600, flexShrink: 0,
                      }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {u.name}
                          {u.id === currentUser.id && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', marginLeft: 6 }}>(you)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${roleBadgeClass(u.role)}`}>{capitalize(u.role)}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                      {u.status === 'active' ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>{formatDate(u.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button className="btn-icon" title="Edit" onClick={() => openEdit(u)}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {u.id !== currentUser.id && (
                        <button className="btn-icon" title="Delete"
                          style={{ color: 'var(--red)', borderColor: 'var(--red-dim)' }}
                          onClick={() => openDelete(u)}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="pagination" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <span className="pagination-info">Showing {users.length} of {pagination.total} users</span>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button className="btn btn-ghost btn-sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {modal === 'edit'   && <EditUserModal user={selected} onClose={closeModal} onSaved={fetchUsers} />}
      {modal === 'delete' && <ConfirmDeleteUser user={selected} onClose={closeModal} onDeleted={fetchUsers} />}
    </div>
  );
}
