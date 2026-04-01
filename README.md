# AHOP PH Calculator

Employee-friendly calculator and explainer for Accumulated Holiday and Overtime Pay (AHOP), built with Next.js and Prisma.

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

## Tech Stack

- Next.js (App Router, TypeScript)
- Prisma ORM (SQLite for development)
- Tailwind CSS

## Setup

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client and run first migration:

```bash
npm run prisma:migrate -- --name init
npm run prisma:generate
```

3. Start development server:

```bash
npm run dev
```

4. Open http://localhost:3000

## Prisma Commands

```bash
npm run prisma:migrate -- --name your_migration_name
npm run prisma:generate
npm run prisma:studio
```

## Important Notes

- v1 annual projection uses fixed handbook baseline behavior.
- SSS/PhilHealth/Pag-IBIG logic is seeded from handbook examples and should be replaced with updated official tables/circulars before production payroll use.
- For Vercel production, switch from SQLite to PostgreSQL and update DATABASE_URL.
