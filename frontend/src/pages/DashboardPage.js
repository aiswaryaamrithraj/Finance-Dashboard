// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../utils/api';
import { formatCurrency, formatDate, formatMonth, capitalize } from '../utils/format';

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color, icon }) => (
  <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
    <div style={{
      position: 'absolute', top: -10, right: -10,
      width: 70, height: 70, borderRadius: '50%',
      background: color, opacity: 0.08,
    }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          {label}
        </p>
        <p className="text-money" style={{ fontSize: '1.6rem', fontWeight: 600, color, lineHeight: 1.2 }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 6 }}>{sub}</p>}
      </div>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: color, opacity: 0.15,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 18, opacity: 1 / 0.15 * 0.8 }}>{icon}</span>
      </div>
    </div>
  </div>
);

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: 6 }}>{label}</p>
      {payload.map(({ name, value, color }) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ color: 'var(--text2)' }}>{capitalize(name)}:</span>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{formatCurrency(value)}</span>
        </div>
      ))}
    </div>
  );
};

const PIE_COLORS = ['#4f8ef7','#22c87a','#f59e0b','#a78bfa','#f05252','#06b6d4','#ec4899'];

export default function DashboardPage() {
  const [summary,    setSummary]    = useState(null);
  const [trends,     setTrends]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [activity,   setActivity]   = useState([]);
  // Default to 2025 — that's where the seeded data lives.
  // Once you add records for the current year it will auto-switch below.
  const [year,       setYear]       = useState(2025);
  const [availableYears, setAvailableYears] = useState([2025]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [s, t, c, a, allTrends] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get(`/dashboard/monthly-trends?year=${year}`),
          api.get('/dashboard/category-totals'),
          api.get('/dashboard/recent-activity?limit=8'),
          api.get('/dashboard/monthly-trends'),   // no year filter = all time
        ]);
        setSummary(s.data.data);
        setTrends(t.data.data.trends.map(r => ({
          ...r,
          month:    formatMonth(r.month),
          income:   parseFloat(r.income),
          expenses: parseFloat(r.expenses),
        })));
        setCategories(c.data.data.categories.map(r => ({
          ...r, total: parseFloat(r.total),
        })));
        setActivity(a.data.data.activities);

        // Build a unique sorted list of years from all records
        const years = [
          ...new Set(
            allTrends.data.data.trends.map(r => r.month.split('-')[0])
          ),
        ].map(Number).sort((a, b) => b - a);
        if (years.length) setAvailableYears(years);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [year]);

  // Aggregate pie data: sum by category (expenses only for spending chart)
  const expenseCategories = categories
    .filter(c => c.type === 'expense')
    .reduce((acc, c) => {
      const existing = acc.find(a => a.name === c.category);
      if (existing) existing.value += c.total;
      else acc.push({ name: c.category, value: c.total });
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-wrap"><div className="spinner" /></div>
      </div>
    );
  }

  const savingsRate = summary?.totalIncome > 0
    ? ((summary.netBalance / summary.totalIncome) * 100).toFixed(1)
    : 0;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Financial overview and analytics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>Year:</label>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '7px 12px' }}
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="Total Income"
          value={formatCurrency(summary?.totalIncome)}
          sub={`${summary?.totalRecords} total records`}
          color="var(--green)"
          icon="↑"
        />
        <KpiCard
          label="Total Expenses"
          value={formatCurrency(summary?.totalExpenses)}
          sub="All categories"
          color="var(--red)"
          icon="↓"
        />
        <KpiCard
          label="Net Balance"
          value={formatCurrency(summary?.netBalance)}
          sub={summary?.netBalance >= 0 ? 'Surplus' : 'Deficit'}
          color={summary?.netBalance >= 0 ? 'var(--accent)' : 'var(--red)'}
          icon="≈"
        />
        <KpiCard
          label="Savings Rate"
          value={`${savingsRate}%`}
          sub="Income retained"
          color="var(--amber)"
          icon="★"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Monthly Trends */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>Monthly Trends</h2>
          {trends.length === 0 ? (
            <div style={{
              height: 240, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              border: '1px dashed var(--border)', borderRadius: 10,
              color: 'var(--text3)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>📊</div>
              <p style={{ fontWeight: 500, marginBottom: 4 }}>No data for {year}</p>
              <p style={{ fontSize: '0.8rem' }}>
                Select a year from the dropdown that has records,
                or add new records for {year}.
              </p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trends} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c87a" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#22c87a" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f05252" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f05252" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="income"   stroke="#22c87a" fill="url(#colorIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="#f05252" fill="url(#colorExp)"    strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* Expense Breakdown Pie */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>Expense Breakdown</h2>
          {expenseCategories.length === 0 ? (
            <div className="empty-state"><p>No expense data</p></div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={expenseCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={42}>
                    {expenseCategories.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {expenseCategories.slice(0, 4).map(({ name, value }, i) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text2)', flex: 1 }}>{name}</span>
                    <span className="text-money" style={{ color: 'var(--text)' }}>{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bar chart + Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
        {/* Monthly Bar */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>Income vs Expenses by Month</h2>
          {trends.length === 0 ? (
            <div style={{
              height: 220, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              border: '1px dashed var(--border)', borderRadius: 10,
              color: 'var(--text3)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📉</div>
              <p style={{ fontSize: '0.875rem' }}>No records for {year}</p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trends} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="income"   fill="#22c87a" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" fill="#f05252" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Recent Activity</h2>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
            {activity.length === 0 ? (
              <div className="empty-state"><p>No recent activity</p></div>
            ) : activity.map((item) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px',
                background: 'var(--bg3)', borderRadius: 8,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: item.type === 'income' ? 'var(--green-dim)' : 'var(--red-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                }}>
                  {item.type === 'income' ? '↑' : '↓'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.category}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{formatDate(item.date)}</p>
                </div>
                <span className="text-money" style={{
                  fontSize: '0.85rem', fontWeight: 600, flexShrink: 0,
                  color: item.type === 'income' ? 'var(--green)' : 'var(--red)',
                }}>
                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}