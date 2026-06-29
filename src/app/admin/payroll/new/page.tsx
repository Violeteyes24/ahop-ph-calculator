"use client";

import { useActionState } from "react";
import { createPeriodAction, type PayrollActionState } from "@/app/actions/payroll";
import Link from "next/link";

const initialState: PayrollActionState = {};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function suggestLabel(start: string, end: string): string {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";
  const fmt = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const startFmt = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(s);
  const endFmt = fmt.format(e);
  return `${startFmt}–${endFmt}`;
}

export default function NewPayrollPeriodPage() {
  const [state, formAction, isPending] = useActionState(createPeriodAction, initialState);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/admin/payroll" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to payroll
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          New payroll period
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This will create attendance entry slots for all active employees.
        </p>
      </div>

      <form action={formAction} className="rounded-xl border border-border bg-card p-6">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="periodStart" className="text-sm font-medium text-foreground">
                Period start
              </label>
              <input
                id="periodStart"
                name="periodStart"
                type="date"
                required
                className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="periodEnd" className="text-sm font-medium text-foreground">
                Period end
              </label>
              <input
                id="periodEnd"
                name="periodEnd"
                type="date"
                required
                className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="label" className="text-sm font-medium text-foreground">
              Period label
            </label>
            <input
              id="label"
              name="label"
              required
              className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="e.g. Nov 11–25 2025"
            />
            <p className="text-xs text-muted-foreground">A short name for this pay period.</p>
          </div>

          <p className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
            AHOP target pay uses the monthly AHOP baseline policy, currently 23 days per month.
          </p>
        </div>

        {state.error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isPending ? "Creating…" : "Create period"}
          </button>
          <Link
            href="/admin/payroll"
            className="rounded-lg border border-input px-5 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
