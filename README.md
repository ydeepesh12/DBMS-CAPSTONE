# SmartChallan — Traffic Violation & Smart Challan Management System

A production-quality, enterprise-grade full-stack web application designed for traffic enforcement, automated camera violation logging, statutory e-challan generation, online citizen dispute/settlement, and executive analytics.

Built strictly according to university DBMS curriculum requirements: **all business logic, audit enforcement, and transactional integrity reside in MySQL 8 Stored Procedures and Triggers**.

---

## 🏛️ System Architecture

```
                  ┌────────────────────────────────────────┐
                  │    Citizen & Department Frontends      │
                  │    React 18 + Vite + Tailwind + Shadcn │
                  └───────────────────┬────────────────────┘
                                      │ HTTP / REST / Cookies
                                      ▼
                  ┌────────────────────────────────────────┐
                  │     SmartChallan Express API Server    │
                  │ Node.js 20 + JWT (HttpOnly) + Multer   │
                  │ PDFKit + QRCode + Zod + OpenAPI / Docs │
                  └──────────┬──────────────────┬──────────┘
                             │                  │
               Prepared SQL  │                  │  Mongoose
             (mysql2/pool)   ▼                  ▼  Metadata
             ┌────────────────────────┐  ┌─────────────────────────┐
             │   MySQL 8.0 Database   │  │    MongoDB Surveillance │
             │  Stored Procedures,    │  │    Evidence Aggregations│
             │  Views, Functions,     │  │    & ANPR AI Telemetry  │
             │  Triggers & Audit Log  │  └─────────────────────────┘
             └────────────────────────┘
```

---

## 🔑 Demo Login Credentials (All 6 Roles)

The system includes pre-seeded demo accounts with bcrypt password hashes (`password123`). You can sign in using credentials or use the **1-Click Demo Switcher** directly in the UI navbar:

| Role | Username | Password | Operational Section | Capabilities & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **OFFICER** | `officer_vikram` | `password123` | `/officer` | Search vehicle, record violation, upload radar evidence, trigger `sp_generate_challan`, view personal workload. (No payment access). |
| **PAYMENT_ADMIN** | `payment_admin` | `password123` | `/payments` | Outstanding challan ledger, counter payment via `sp_process_payment`, batch late fees `sp_apply_late_fees`, collection reports. |
| **APPEAL_OFFICER** | `appeal_kavita` | `password123` | `/appeals` | Pending appeal queue, evidence gallery inspection, adjudicate via `sp_decide_appeal` (`ACCEPTED` / `REJECTED`). |
| **TRAFFIC_ADMIN** | `traffic_admin` | `password123` | `/admin` | Full relational CRUD on owners, vehicles, drivers, licenses, officers, violation rules, locations, app users, and audit trail ledger. |
| **MANAGEMENT** | `management_lead` | `password123` | `/analytics` | Read-only executive analytics dashboards (8 SQL query charts, Leaflet hotspot map, MongoDB AI telemetry). |
| **CITIZEN / OWNER** | `citizen_aarav` | `password123` | `/` (Citizen Portal) | Search by registration or challan number, view lifecycle timeline, simulate online payment, file appeal, download PDF receipt with QR code. |

---

## ⚡ Quick Start Guide (Windows / Mac / Linux)

### Prerequisites
- **Node.js**: v20 or higher (Current machine has `v26.7.0`)
- **MongoDB**: Installed & running on default port `27017` (Already running on this machine)
- **MySQL 8.0**: Installed & running on default port `3306` (Already running as service `MySQL80`)

### 1. Configure MySQL Password in `.env`
Set your MySQL password in `backend/.env` or the root `.env`. When both files exist, values in the root `.env` take precedence; the backend file is also loaded when commands are run from the project root.
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=<your_mysql_root_password>
MYSQL_DATABASE=traffic_challan

MONGO_URI=mongodb://127.0.0.1:27017/traffic_challan
JWT_SECRET=smart_challan_secret_jwt_key_2026_super_secure
```
If the API reports `Access denied for user`, correct `MYSQL_USER` and `MYSQL_PASSWORD` for your local MySQL account, then restart the backend before recording violations.

### 2. Run Database Setup & Migration (One-Command)
Seeds MySQL schema, views, functions, stored procedures, sample data, app users, and MongoDB evidence documents:
```bash
npm run setup
```

### 3. Run Automated Integration Test Suite
Verifies RBAC, Stored Procedure generation, duplicate payment rejection (409), wrong amount rejection (422), concurrency double-payment race lock, and transaction rollback:
```bash
npm test
```

### 4. Start the Application
In terminal 1 (Backend API):
```bash
npm run backend
# API runs on http://localhost:5000
# OpenAPI Swagger docs at http://localhost:5000/api/docs
```

In terminal 2 (Frontend React App):
```bash
npm run frontend
# Frontend runs on http://localhost:5173
```

---

## 🐳 Docker Deployment
To run with docker-compose:
```bash
docker-compose up --build
```
This launches:
- `smartchallan_mysql` on port `3306` (auto-executes `01_schema.sql` through `09_app_user.sql`)
- `smartchallan_mongo` on port `27017`
- `smartchallan_backend` on port `5000`
- `smartchallan_frontend` on port `5173`

---

## 🎓 DBMS Viva Demonstration Guide

Visit the **DBMS Lab** screen at `http://localhost:5173/dbms-lab` during evaluation/viva:

### Challenge 1: Multi-Step Atomic Transaction (Atomicity Demonstration)
- Demonstrates `sp_violation_to_payment` which coordinates:
  1. Record Violation (`violation` table)
  2. Compute base fine & Issue Challan (`challan` table)
  3. Execute Payment Settlement (`payment` table)
- **COMMIT Test**: Shows that when all steps succeed, all tables update simultaneously.
- **ROLLBACK Test**: Simulates a banking gateway failure mid-transaction. Demonstrates that MySQL rolls back the entire transaction — neither the Challan nor the Payment record persist in the database, preserving state consistency.

### Challenge 2: Simultaneous Double-Payment Race Condition (Isolation Demonstration)
- Fires two simultaneous payment requests for the exact same challan using `Promise.allSettled`.
- **Outcome**: Exactly **ONE** request succeeds (`200 OK`) and the second is rejected (`409 Conflict`), prevented by `SELECT ... FOR UPDATE` row-level pessimistic locking and optimistic version tracking (`version = version + 1`).

---

## 📊 Analytical Queries Implemented

All 8 queries from Section 3 are fully operational in `traffic_challan_dbms/05_advanced_queries.sql` and visualised on `/analytics`:
1. **Repeat Offenders**: Vehicles with &gt;= 2 violations in the past 6 months.
2. **High Unpaid Fine Defaulters**: Outstanding fines filtered above configurable threshold.
3. **Violation Hotspots**: Radar junctions ranked with coordinates plotted on interactive Leaflet map.
4. **Monthly Collections with Running Cumulative Total**: Window function `SUM(monthly_amount) OVER (...)` with Month-over-Month percentage growth.
5. **Appealed vs Non-Appealed Comparison**: Dispute settlement ratio.
6. **Collection Efficiency per Violation Type**: Recovery rate % per infraction code.
7. **License Risk**: Infractions committed by drivers with `SUSPENDED` or `EXPIRED` licenses.
8. **Officer Workload**: Live SQL View invocation from `v_officer_workload`.

---

## 📁 Repository Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # MySQL pool & MongoDB Mongoose connections
│   │   ├── middleware/      # JWT RBAC, Zod validation, Centralized Error Handler
│   │   ├── models/          # MongoDB Evidence Metadata Mongoose Model
│   │   ├── routes/          # Auth, Citizens, Officers, Payments, Appeals, Admin, Analytics, Demo
│   │   ├── services/        # PDFKit receipt generator with QR Code
│   │   ├── docs/            # OpenAPI 3.0 swagger.json & Postman Collection
│   │   └── scripts/         # setupDb.js & runTests.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, StatusBadge, PaymentModal, AppealModal, HotspotMap
│   │   ├── context/         # AuthContext (RBAC state & 1-click role switcher, Dark Mode)
│   │   ├── pages/           # Landing, Detail, Login, Officer, Payment, Appeal, Admin, Analytics, Lab
│   │   ├── types/           # TypeScript interfaces
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
├── traffic_challan_dbms/
│   ├── 01_schema.sql                 # 13 relational tables
│   ├── 02_views_functions_triggers.sql# Views, fn_outstanding, fn_late_fee, audit & payment triggers
│   ├── 03_procedures.sql             # sp_generate_challan, sp_process_payment, sp_violation_to_payment...
│   ├── 04_sample_data.sql            # Test vehicles, officers, violation types, locations
│   ├── 05_advanced_queries.sql       # 8 analytical dashboard SQL queries
│   ├── 07_mongodb_evidence.js        # MongoDB schema, seed & aggregation pipelines
│   └── 09_app_user.sql               # App users table & bcrypt credentials
├── docker-compose.yml
├── README.md
└── package.json
```
