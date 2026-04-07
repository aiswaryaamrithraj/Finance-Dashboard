// src/pages/RecordsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate, capitalize } from '../utils/format';

const CATEGORIES = ['Salary','Freelance','Consulting','Sales','Rent','Utilities','Marketing','Software','Equipment','Travel','Salaries','Food','Other'];

// ── Record Form Modal ──────────────────────────────────────────────────────────
function RecordModal({ record, onClose, onSaved }) {
  const isEdit = !!record?.id;
  const [form, setForm] = useState({
    amount:      record?.amount      || '',
    type:        record?.type        || 'income',
    category:    record?.category    || '',
    date:        record?.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    description: record?.description || '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/records/${record.id}`, form);
      } else {
        await api.post('/records', form);
      }
      onSaved();
      onClose();
    } catch (err) {
      const msgs = err.response?.data?.errors;
      setError(msgs ? msgs.map(e => e.message).join(', ') : err.response?.data?.message || 'Failed to save record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Record' : 'New Record'}</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select name="type" className="form-control" value={form.type} onChange={handleChange}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input name="amount" type="number" step="0.01" min="0.01" className="form-control"
                  placeholder="0.00" value={form.amount} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select name="category" className="form-control" value={form.category} onChange={handleChange} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input name="date" type="date" className="form-control" value={form.date} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input name="description" type="text" className="form-control"
                placeholder="Brief description…" value={form.description} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
function ConfirmDelete({ record, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/records/${record.id}`);
      onDeleted();
      onClose();
    } catch { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <h2 className="modal-title">Delete Record?</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
          This will soft-delete the record for <strong style={{ color: 'var(--text)' }}>{record.category}</strong> — {formatCurrency(record.amount)}.
          The record is preserved in the database for audit purposes.
        </p>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Records Page ──────────────────────────────────────────────────────────
export default function RecordsPage() {
  const { canWrite, canDelete } = useAuth();
  const [records,    setRecords]    = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null); // null | 'create' | 'edit' | 'delete'
  const [selected,   setSelected]   = useState(null);
  const [filters,    setFilters]    = useState({ type: '', category: '', startDate: '', endDate: '', search: '' });
  const [page,       setPage]       = useState(1);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const { data } = await api.get(`/records?${params}`);
      setRecords(data.data.records);
      setPagination(data.data.pagination);
    } catch (err) {
      console.error('fetchRecords error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [filters]);

  const handleFilterChange = (e) => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
  const clearFilters = () => setFilters({ type: '', category: '', startDate: '', endDate: '', search: '' });

  const openEdit   = (record) => { setSelected(record); setModal('edit'); };
  const openDelete = (record) => { setSelected(record); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Records</h1>
          <p className="page-sub">{pagination.total} total records</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => setModal('create')}>
            + New Record
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card card-sm" style={{ marginBottom: 20 }}>
        <div className="filters-bar">
          <input name="search" className="form-control search-input" placeholder="Search description or category…"
            value={filters.search} onChange={handleFilterChange} />
          <select name="type" className="form-control" value={filters.type} onChange={handleFilterChange}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select name="category" className="form-control" value={filters.category} onChange={handleFilterChange}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input name="startDate" type="date" className="form-control" value={filters.startDate} onChange={handleFilterChange} />
          <input name="endDate"   type="date" className="form-control" value={filters.endDate}   onChange={handleFilterChange} />
          {activeFilters > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Created by</th>
                {(canWrite || canDelete) && <th style={{ textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div style={{ fontSize: '2rem' }}>📋</div>
                      <p>No records found</p>
                    </div>
                  </td>
                </tr>
              ) : records.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text2)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {formatDate(r.date)}
                  </td>
                  <td>
                    <span className={`badge ${r.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                      {r.type === 'income' ? '↑' : '↓'} {capitalize(r.type)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.category}</td>
                  <td style={{ color: 'var(--text2)', fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.description || <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>
                  <td className="text-money" style={{
                    textAlign: 'right', fontWeight: 600,
                    color: r.type === 'income' ? 'var(--green)' : 'var(--red)',
                  }}>
                    {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>{r.created_by_name}</td>
                  {(canWrite || canDelete) && (
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {canWrite && (
                          <button className="btn-icon" title="Edit" onClick={() => openEdit(r)}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}
                        {canDelete && (
                          <button className="btn-icon" title="Delete"
                            style={{ color: 'var(--red)', borderColor: 'var(--red-dim)' }}
                            onClick={() => openDelete(r)}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <span className="pagination-info">
              Showing {((page - 1) * 12) + 1}–{Math.min(page * 12, pagination.total)} of {pagination.total}
            </span>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              ← Prev
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} className="btn btn-sm" onClick={() => setPage(p)}
                  style={{
                    background: p === page ? 'var(--accent)' : 'transparent',
                    color: p === page ? '#fff' : 'var(--text2)',
                    border: '1px solid var(--border)',
                    minWidth: 34,
                  }}>
                  {p}
                </button>
              );
            })}
            <button className="btn btn-ghost btn-sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'create' && <RecordModal onClose={closeModal} onSaved={fetchRecords} />}
      {modal === 'edit'   && <RecordModal record={selected} onClose={closeModal} onSaved={fetchRecords} />}
      {modal === 'delete' && <ConfirmDelete record={selected} onClose={closeModal} onDeleted={fetchRecords} />}
    </div>
  );
}
