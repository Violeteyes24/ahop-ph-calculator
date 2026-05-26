"use client";

import { useActionState } from "react";
import { createPeriodAction, type PayrollActionState } from "@/app/actions/payroll";
import Link from "next/link";

const initialState: PayrollActionState = {};

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
        <Link href="/admin/payroll" className="text-sm text-[#6b7280] hover:text-[#1a2e1f]">
          ← Back to payroll
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a2e1f]">
          New payroll period
        </h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          This will create attendance entry slots for all active employees.
        </p>
      </div>

      <form action={formAction} className="rounded-xl border border-[#ddd6ca] bg-white p-6">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="periodStart" className="text-sm font-medium text-[#374151]">
                Period start
              </label>
              <input
                id="periodStart"
                name="periodStart"
                type="date"
                required
                className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="periodEnd" className="text-sm font-medium text-[#374151]">
                Period end
              </label>
              <input
                id="periodEnd"
                name="periodEnd"
                type="date"
                required
                className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="label" className="text-sm font-medium text-[#374151]">
              Period label
            </label>
            <input
              id="label"
              name="label"
              required
              className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
              placeholder="e.g. Nov 11–25 2025"
            />
            <p className="text-xs text-[#9ca3af]">A short name for this pay period.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="baselineDays" className="text-sm font-medium text-[#374151]">
              Baseline days
            </label>
            <input
              id="baselineDays"
              name="baselineDays"
              type="number"
              min="1"
              max="31"
              defaultValue="23"
              required
              className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
            />
            <p className="text-xs text-[#9ca3af]">
              The standard number of working days for AHOP calculation (typically 23).
            </p>
          </div>
        </div>

        {state.error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-[#2f4f3e] px-5 py-2 text-sm font-semibold text-white hover:bg-[#274636] disabled:opacity-60"
          >
            {isPending ? "Creating…" : "Create period"}
          </button>
          <Link
            href="/admin/payroll"
            className="rounded-lg border border-[#d1d5db] px-5 py-2 text-sm font-medium text-[#374151] hover:bg-[#f5f0e8]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
