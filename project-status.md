# Project Status — Apnea Dynamics Payroll System

**Date:** 2026-05-26  
**Build status:** Passing locally (`npm run build` — 0 TypeScript errors, 19 routes)  
**Deployment status:** Blocked (see below)

---

## What's Been Built

### Authentication
- Custom JWT sessions via `jose` (httpOnly cookie, 7-day expiry)
- Two roles: `ADMIN` and `EMPLOYEE`
- Login page at `/login` with bcrypt password verification
- Middleware protecting all routes — admins to `/admin/*`, employees to `/payslip/*`
- Default admin: `admin@apneadynamics.org` / `changeme123` (change after first login)

### Database Schema (Prisma + PostgreSQL)
New models added to the existing schema:
- `User` — email/password auth, linked to `EmployeeProfile`
- `PayrollPeriod` — tracks each payroll run (DRAFT → COMPLETED → ARCHIVED)
- `AttendanceEntry` — one row per employee per period (replaces Excel rows)
- `PayrollSnapshot` — extended with `periodId` FK

### Admin Panel (`/admin/*`)
| Route | Purpose |
|-------|---------|
| `/admin/dashboard` | Stats: employee count, open period, recent runs |
| `/admin/employees` | Employee list with active/inactive filter |
| `/admin/employees/new` | Create employee + linked user account |
| `/admin/employees/[id]/edit` | Edit employee details |
| `/admin/payroll` | List of all payroll periods |
| `/admin/payroll/new` | Create a new period (auto-creates one AttendanceEntry per active employee) |
| `/admin/payroll/[periodId]` | Attendance entry grid with live gross/net preview |
| `/admin/payroll/[periodId]/results` | Full period results table + CSV export |
| `/admin/payroll/[periodId]/payslip/[employeeId]` | Printable admin payslip view |
| `/admin/reports` | Government remittance totals + YTD AHOP tracker |
| `/admin/settings` | ContributionRateConfig CRUD |

### Employee Self-Service (`/payslip/*`)
- `/payslip` — employee's own payslip history
- `/payslip/[periodId]` — full payslip for a period (printable)

### Payroll Engine
- `calculatePayroll()` in `src/lib/ahop.ts` — unchanged, used both server-side (run payroll) and client-side (live preview)
- All 26 CSV columns matching the original Excel format
- SSS brackets, PhilHealth 2.5%, configurable semi-month Pag-IBIG defaulting to ₱100
- AHOP top-up, OT (regular + extended), SIL/SL leave pay
- Previous YTD AHOP correctly pulled from last snapshot (bug in original generator fixed)
- CSV export at `/api/payroll/[periodId]/export`

### Other
- `/calculator` — original standalone calculator preserved
- Seed script: `npx prisma db seed` creates admin user + default ContributionRateConfig

---

## Deployment Blocker

**Error:** `npm run build` exits with code 1 on Vercel  
**Root cause:** Two missing environment variables + no hosted database

Vercel runs `prisma generate` during build, which needs a valid `DATABASE_URL`. The local `.env` points to `localhost:5432` which is unreachable from Vercel's build servers.

### Steps to Fix

1. **Provision a hosted PostgreSQL database**  
   Options (all have free tiers):
   - [Neon](https://neon.tech) — recommended, Prisma-native, serverless-friendly
   - [Supabase](https://supabase.com) — get the "connection string" (not the Supabase URL)
   - Vercel Postgres (from the Vercel dashboard Storage tab)

   Copy the connection string — it looks like:  
   `postgresql://user:password@host:5432/dbname?sslmode=require`

2. **Set environment variables in Vercel**  
   In the Vercel dashboard → Project → Settings → Environment Variables, add:
   ```
   DATABASE_URL=<your hosted postgres connection string>
   SESSION_SECRET=<random 64-char hex string>
   ```
   To generate SESSION_SECRET locally:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Run migrations against the hosted DB**  
   From your local machine with the hosted `DATABASE_URL` set:
   ```
   DATABASE_URL="<hosted connection string>" npx prisma migrate deploy
   ```

4. **Run the seed script**  
   ```
   DATABASE_URL="<hosted connection string>" npx prisma db seed
   ```
   This creates the admin user (`admin@apneadynamics.org` / `changeme123`) and a default ContributionRateConfig.

5. **Redeploy on Vercel**  
   Trigger a new deployment — it should pass now.

6. **Change the admin password**  
   Log in as admin and update the password immediately (password change UI is Phase 2 — for now, update directly in the DB via Prisma Studio or a one-off script).

---

## Phase 2 (Not Yet Built)

- [ ] Password change flow for employees
- [ ] BIR withholding tax calculation (currently hardcoded to 0)
- [ ] Excel import UI (bootstrapping existing employee data from old spreadsheets)
- [ ] Pagination on long lists
- [ ] Audit log
- [ ] `anotherOT` and `coAhop` columns (currently 0 placeholders — needs business clarification)

---

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | All models including new User, PayrollPeriod, AttendanceEntry |
| `prisma/seed.ts` | Creates admin user + default config |
| `src/lib/session.ts` | JWT session management |
| `src/lib/auth.ts` | `requireAdmin()`, `requireEmployee()` guards |
| `src/middleware.ts` | Route protection |
| `src/app/actions/payroll.ts` | `runPayrollAction` — the core payroll run logic |
| `src/app/admin/payroll/[periodId]/attendance-grid.tsx` | Main HR data entry UI |
| `src/lib/ahop.ts` | Payroll calculation engine (unchanged) |
