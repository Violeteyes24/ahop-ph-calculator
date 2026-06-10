# AHOP PH Calculator

Employee-friendly calculator and explainer for Accumulated Holiday and Overtime Pay (AHOP), built with Next.js, Prisma, PostgreSQL, and shadcn/ui.

## Current Scope (v1)

- Public, no-login calculator
- Inputs include:
	- Date started
	- Salary type (daily or monthly)
	- Daily rate and monthly rate
	- Working days and baseline days
	- Probationary deduction percent
- Outputs include:
	- Regular pay
	- AHOP top-up
	- Gross with AHOP
	- SSS, PhilHealth, Pag-IBIG employee and employer shares
	- Net pay
- Handbook sample fixtures are shown in-app for quick validation
- Admin payroll system with employee records, draft payroll periods, attendance entry, payroll snapshots, reports, payslips, and CSV export
- Excel workbook import at `/admin/payroll/import`, with preview before creating a draft payroll period

## Tech Stack

- Next.js (App Router, TypeScript)
- Prisma ORM
- PostgreSQL
- shadcn/ui
- Tailwind CSS

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Ensure PostgreSQL is running.

Option A: local PostgreSQL instance.

Option B: Docker Compose:

```bash
docker compose up -d
```

Option C: Supabase Postgres:
- Set `DATABASE_URL` to the pooled Supabase connection string.
- Set `DIRECT_URL` to the direct Supabase connection string.
- Add `schema=payroll` and `uselibpqcompat=true` to both URLs.

4. Generate Prisma client, apply migrations, and seed defaults:

```bash
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
```

5. Start development server:

```bash
npm run dev
```

6. Open http://localhost:3000

## Simple End-to-End Test (Current Features)

This app can be tested end to end without creating any account.

1. Start the app:

```bash
npm run dev
```

2. Open http://localhost:3000.

3. Confirm the header says AHOP PH v1 and you can see these sections:
- Employee Inputs
- Computed Breakdown
- Annual Projection (v1)
- Handbook Reference Fixtures

4. Enter this sample input:
- Employee Name: Juan Dela Cruz
- Date Started: 2026-01-01
- Salary Type: Daily
- Daily Rate: 500
- Monthly Rate: 11000
- Working Days: 22
- Baseline Days: 23
- Probationary Deduction (%): 0

5. Confirm expected outputs:
- Regular Pay: PHP 11,000.00
- AHOP Top-up: PHP 500.00
- Gross With AHOP: PHP 11,500.00

6. Change Working Days from 22 to 24 and verify:
- Regular Pay increases
- AHOP Top-up decreases or becomes zero when regular pay reaches baseline
- Gross With AHOP adjusts accordingly

7. Set Probationary Deduction (%) to 10 and verify:
- Probationary Deduction is greater than zero
- Net Pay decreases

8. Check the handbook fixture table at the bottom:
- Sample rows are visible
- SSS, PhilHealth, and Pag-IBIG ER/EE columns are present

9. Optional quality checks:

```bash
npm run lint
npm run build
```

If both pass, the frontend is in a healthy state for v1.

## Prisma Commands

```bash
npm run prisma:migrate -- --name your_migration_name
npm run prisma:generate
npm run prisma:studio
```

## Important Notes

- v1 annual projection uses fixed handbook baseline behavior.
- SSS/PhilHealth/Pag-IBIG logic is seeded from handbook examples and should be replaced with updated official tables/circulars before production payroll use.
- Use a managed PostgreSQL instance for production. Supabase is supported as hosted PostgreSQL; this app does not use Supabase Auth/RLS in v1.
- Keep payroll tables in the `payroll` Postgres schema so unrelated Supabase `public` tables are not affected.
