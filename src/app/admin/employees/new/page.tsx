"use client";

import { useActionState } from "react";
import { createEmployeeAction, type EmployeeActionState } from "@/app/actions/employees";
import Link from "next/link";

const initialState: EmployeeActionState = {};

export default function NewEmployeePage() {
  const [state, formAction, isPending] = useActionState(createEmployeeAction, initialState);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/employees" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to employees
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Add employee</h1>
      </div>

      <form action={formAction} className="rounded-xl border border-border bg-card p-6">
        <EmployeeFormFields />

        <div className="mt-6 border-t border-border pt-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Account credentials</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="employee@apneadynamics.org"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Initial password
              </label>
              <input
                id="password"
                name="password"
                type="text"
                required
                minLength={8}
                className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Min. 8 characters"
              />
              <p className="text-xs text-muted-foreground">Share this with the employee so they can sign in.</p>
            </div>
          </div>
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
            {isPending ? "Creating…" : "Create employee"}
          </button>
          <Link
            href="/admin/employees"
            className="rounded-lg border border-input px-5 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export function EmployeeFormFields({
  defaults,
}: {
  defaults?: {
    fullName?: string;
    position?: string;
    dateStarted?: string;
    salaryType?: string;
    salaryCategory?: string;
    dailyRate?: string;
    monthlyRate?: string;
    employmentStage?: string;
    paymentMethod?: string;
    deminimisAmount?: string;
  };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-foreground">Full name</label>
        <input
          id="fullName"
          name="fullName"
          required
          defaultValue={defaults?.fullName}
          className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="Juan Dela Cruz"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="position" className="text-sm font-medium text-foreground">Position</label>
        <input
          id="position"
          name="position"
          defaultValue={defaults?.position}
          className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="Dive Instructor"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="dateStarted" className="text-sm font-medium text-foreground">Date started</label>
        <input
          id="dateStarted"
          name="dateStarted"
          type="date"
          required
          defaultValue={defaults?.dateStarted}
          className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="salaryType" className="text-sm font-medium text-foreground">Salary type</label>
        <select
          id="salaryType"
          name="salaryType"
          defaultValue={defaults?.salaryType ?? "DAILY"}
          className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="DAILY">Daily</option>
          <option value="MONTHLY">Monthly</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="salaryCategory" className="text-sm font-medium text-foreground">Salary category</label>
        <select
          id="salaryCategory"
          name="salaryCategory"
          defaultValue={defaults?.salaryCategory ?? "AHOP"}
          className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="AHOP">AHOP</option>
          <option value="NON_AHOP">Non-AHOP</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="dailyRate" className="text-sm font-medium text-foreground">Daily rate (₱)</label>
        <input
          id="dailyRate"
          name="dailyRate"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaults?.dailyRate}
          className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="500.00"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="monthlyRate" className="text-sm font-medium text-foreground">Monthly rate (₱)</label>
        <input
          id="monthlyRate"
          name="monthlyRate"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaults?.monthlyRate}
          className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="11000.00"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="employmentStage" className="text-sm font-medium text-foreground">Employment stage</label>
        <select
          id="employmentStage"
          name="employmentStage"
          defaultValue={defaults?.employmentStage ?? "PROBATIONARY"}
          className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="PROBATIONARY">Probationary</option>
          <option value="REGULAR">Regular</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="paymentMethod" className="text-sm font-medium text-foreground">Payment method</label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          defaultValue={defaults?.paymentMethod ?? "BANK"}
          className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="BANK">Bank</option>
          <option value="CASH">Cash</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="deminimisAmount" className="text-sm font-medium text-foreground">De Minimis (₱/month)</label>
        <input
          id="deminimisAmount"
          name="deminimisAmount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaults?.deminimisAmount ?? "0"}
          className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  );
}
