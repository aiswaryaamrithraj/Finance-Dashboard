# Finance Dashboard System

A full-stack finance dashboard with role-based access control, built with **Node.js + Express + MySQL + React**.

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Backend   | Node.js, Express.js                     |
| Database  | MySQL (via `mysql2` with connection pool)|
| Auth      | JWT (jsonwebtoken) + bcrypt             |
| Frontend  | React 18, React Router v6               |
| Charts    | Recharts                                |
| Validation| express-validator                       |
| Security  | express-rate-limit, CORS, bcryptjs      |

---

## Quick Start

### Prerequisites
- Node.js v16+
- MySQL 8.0+

### 1. Clone and install
```bash
git clone <your-repo-url>
cd finance-dashboard
npm run install:all
```

### 2. Configure the backend
```bash
cd backend
cp .env.example .env   # or edit .env directly
```
Edit `.env`:
```
DB_PASSWORD=your_mysql_root_password
JWT_SECRET=any_long_random_string_at_least_32_chars
```

### 3. Create the database and seed data
```bash
cd backend
npm run db:setup
```
This creates all tables and 3 demo users:

| Email                  | Password    | Role    |
|------------------------|-------------|---------|
| admin@finance.com      | password123 | Admin   |
| analyst@finance.com    | password123 | Analyst |
| viewer@finance.com     | password123 | Viewer  |

### 4. Run both servers
```bash
cd ..                 # back to project root
npm run dev           # starts backend (port 5000) + frontend (port 3000)
```

Open **http://localhost:3000** in your browser.

---

## Project Structure

```
finance-dashboard/
├── backend/
│   ├── config/
│   │   ├── db.js               ← MySQL connection pool
│   │   └── setupDatabase.js    ← Creates tables + seeds data
│   ├── controllers/
│   │   ├── authController.js   ← register, login, getMe
│   │   ├── recordsController.js← CRUD for financial records
│   │   ├── dashboardController.js ← Analytics queries
│   │   └── usersController.js  ← Admin user management
│   ├── middleware/
│   │   ├── auth.js             ← JWT verify + role authorize()
│   │   └── validate.js         ← express-validator rule sets
│   ├── routes/
│   │   ├── auth.js             ← /api/auth/*
│   │   ├── records.js          ← /api/records/*
│   │   ├── dashboard.js        ← /api/dashboard/*
│   │   └── users.js            ← /api/users/*
│   ├── .env
│   ├── package.json
│   └── server.js               ← App entry point
│
└── frontend/
    ├── public/index.html
    └── src/
        ├── contexts/
        │   └── AuthContext.js  ← Global user state (React Context)
        ├── components/
        │   └── layout/
        │       └── Sidebar.js  ← Navigation sidebar
        ├── pages/
        │   ├── LoginPage.js    ← Login form + demo accounts
        │   ├── DashboardPage.js← KPIs + charts (Recharts)
        │   ├── RecordsPage.js  ← Table + CRUD modals + filters
        │   └── UsersPage.js    ← Admin user management
        ├── utils/
        │   ├── api.js          ← axios instance + JWT interceptor
        │   └── format.js       ← Currency, date formatting
        ├── App.js              ← Routing + ProtectedRoute
        ├── index.js
        └── index.css           ← Global design system
```

---

## Role-Based Access Control

| Action                    | Viewer | Analyst | Admin |
|---------------------------|--------|---------|-------|
| View dashboard            | ✅     | ✅      | ✅    |
| View records              | ✅     | ✅      | ✅    |
| Create records            | ❌     | ✅      | ✅    |
| Edit records              | ❌     | ❌      | ✅    |
| Delete records (soft)     | ❌     | ❌      | ✅    |
| View users list           | ❌     | ❌      | ✅    |
| Change user role/status   | ❌     | ❌      | ✅    |
| Delete users              | ❌     | ❌      | ✅    |

Enforcement happens at **two levels**:
1. **Backend** — `authorize('admin')` middleware on routes returns 403 if role doesn't match
2. **Frontend** — Buttons/links hidden based on `user.role` from AuthContext

---

## API Reference

### Auth
```
POST /api/auth/register   { name, email, password, role? }
POST /api/auth/login      { email, password }
GET  /api/auth/me         (requires token)
```

### Financial Records
```
GET    /api/records              ?type, category, startDate, endDate, search, page, limit
GET    /api/records/:id
POST   /api/records              { amount, type, category, date, description? }  [analyst+]
PUT    /api/records/:id          { amount, type, category, date, description? }  [admin]
DELETE /api/records/:id          (soft delete)                                   [admin]
```

### Dashboard Analytics
```
GET /api/dashboard/summary          ?startDate, endDate
GET /api/dashboard/category-totals  ?type, startDate, endDate
GET /api/dashboard/monthly-trends   ?year
GET /api/dashboard/recent-activity  ?limit
```

### Users (Admin only)
```
GET    /api/users         ?role, status, search, page, limit
GET    /api/users/:id
PUT    /api/users/:id     { name?, role?, status? }
DELETE /api/users/:id
```

All protected routes require: `Authorization: Bearer <token>`

---

## Key Design Decisions

**Soft Delete**: Financial records are never truly deleted — `deleted_at` is set instead. This preserves audit history, which is critical in any finance application.

**Connection Pooling**: Using `mysql2/promise` with a pool of 10 connections ensures fast database access under load without connection overhead.

**JWT over Sessions**: Stateless authentication means the backend doesn't need to store session data. The token contains the user ID; the server re-fetches the user on each request to get fresh role/status data.

**Role Checking in Middleware**: The `authorize('admin', 'analyst')` middleware is applied at the route level, not inside controllers. This keeps controllers clean and makes permissions visible in one place.

**Two-Layer Auth Enforcement**: Both backend (middleware) and frontend (conditional rendering) enforce roles. The frontend layer improves UX; the backend layer is the actual security barrier.

**Parameterized Queries**: All SQL uses `?` placeholders via `mysql2` — never string concatenation — preventing SQL injection.

---

## Assumptions Made

1. Currency is Indian Rupees (INR). Change `formatCurrency` in `utils/format.js` to switch.
2. All dates are stored in UTC.
3. The `analyst` role cannot edit existing records, only create new ones.
4. A user cannot deactivate or delete their own account.
5. Soft-deleted records are excluded from all queries and analytics.
6. The `admin` user who seeds the database owns all 30 sample records.
#
