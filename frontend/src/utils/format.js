// src/utils/format.js
// Helper functions used throughout the app.

// Format a number as Indian Rupees (or change locale/currency as needed)
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

// Format a date string "2025-01-15" → "Jan 15, 2025"
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

// Format "2025-01" → "Jan 2025"
export const formatMonth = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

// Capitalize first letter
export const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

// Get the role color badge class
export const roleBadgeClass = (role) => ({
  admin:   'badge-purple',
  analyst: 'badge-blue',
  viewer:  'badge-green',
}[role] || 'badge-blue');
