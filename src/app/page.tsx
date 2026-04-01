"use client";

import { useMemo, useState } from "react";
import { calculatePayroll, HANDBOOK_REFERENCE, type SalaryType } from "@/lib/ahop";

function toPeso(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function Home() {
  const [salaryType, setSalaryType] = useState<SalaryType>("DAILY");
  const [fullName, setFullName] = useState("");
  const [dateStarted, setDateStarted] = useState("2026-01-01");
  const [dailyRate, setDailyRate] = useState(500);
  const [monthlyRate, setMonthlyRate] = useState(11000);
  const [workingDays, setWorkingDays] = useState(22);
  const [baselineDays, setBaselineDays] = useState(23);
  const [probationaryDeductionPct, setProbationaryDeductionPct] = useState(0);

  const result = useMemo(
    () =>
      calculatePayroll({
        salaryType,
        dailyRate,
        monthlyRate,
        workingDays,
        baselineDays,
        probationaryDeductionPct,
      }),
    [salaryType, dailyRate, monthlyRate, workingDays, baselineDays, probationaryDeductionPct],
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="surface rounded-2xl p-5 sm:p-8">
        <p className="caption text-xs uppercase tracking-[0.2em]">AHOP PH v1 • Employee Explainer</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Payroll Snapshot: Regular vs With AHOP</h1>
        <p className="caption mt-3 max-w-3xl text-sm leading-7 sm:text-base">
          This calculator follows your handbook policy for daily wage with Accumulated Holiday and Overtime Pay (AHOP),
          bi-monthly payout timing, and mandatory SSS, PhilHealth, and Pag-IBIG deductions.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface rounded-2xl p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Employee Inputs</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="caption text-xs">Employee Name</span>
              <input
                className="rounded-md border border-[#dad3c7] bg-white px-3 py-2 text-sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Dela Cruz"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="caption text-xs">Date Started</span>
              <input
                type="date"
                className="rounded-md border border-[#dad3c7] bg-white px-3 py-2 text-sm"
                value={dateStarted}
                onChange={(e) => setDateStarted(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="caption text-xs">Salary Type</span>
              <select
                className="rounded-md border border-[#dad3c7] bg-white px-3 py-2 text-sm"
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value as SalaryType)}
              >
                <option value="DAILY">Daily</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="caption text-xs">Daily Rate</span>
              <input
                type="number"
                className="rounded-md border border-[#dad3c7] bg-white px-3 py-2 text-sm"
                value={dailyRate}
                onChange={(e) => setDailyRate(Number(e.target.value) || 0)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="caption text-xs">Monthly Rate</span>
              <input
                type="number"
                className="rounded-md border border-[#dad3c7] bg-white px-3 py-2 text-sm"
                value={monthlyRate}
                onChange={(e) => setMonthlyRate(Number(e.target.value) || 0)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="caption text-xs">Working Days (Current Period)</span>
              <input
                type="number"
                className="rounded-md border border-[#dad3c7] bg-white px-3 py-2 text-sm"
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value) || 0)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="caption text-xs">Baseline Days</span>
              <input
                type="number"
                className="rounded-md border border-[#dad3c7] bg-white px-3 py-2 text-sm"
                value={baselineDays}
                onChange={(e) => setBaselineDays(Number(e.target.value) || 1)}
              />
            </label>

            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="caption text-xs">Probationary Deduction (%)</span>
              <input
                type="number"
                step="0.01"
                className="rounded-md border border-[#dad3c7] bg-white px-3 py-2 text-sm"
                value={probationaryDeductionPct}
                onChange={(e) => setProbationaryDeductionPct(Number(e.target.value) || 0)}
              />
            </label>
          </div>
          <p className="caption mt-4 text-xs">
            Notes: Pay schedule follows handbook windows: 26th-10th paid on 15th, 11th-25th paid on last day of month.
            Payment method is cash or direct bank only.
          </p>
        </div>

        <div className="surface rounded-2xl p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Computed Breakdown</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-md bg-[#f4eee4] px-3 py-2">
              <span>Regular Pay</span>
              <strong>{toPeso(result.regularPay)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-md bg-[#f2e2d5] px-3 py-2">
              <span>AHOP Top-up</span>
              <strong>{toPeso(result.ahopTopup)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-md bg-[#ebf3ed] px-3 py-2 text-base">
              <span>Gross With AHOP</span>
              <strong>{toPeso(result.grossWithAhop)}</strong>
            </div>
          </div>

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#5c665f]">Employee Deductions</h3>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between"><span>SSS (EE)</span><span>{toPeso(result.sssEmployee)}</span></div>
            <div className="flex items-center justify-between"><span>PhilHealth (EE)</span><span>{toPeso(result.philHealthEmployee)}</span></div>
            <div className="flex items-center justify-between"><span>Pag-IBIG (EE)</span><span>{toPeso(result.pagIbigEmployee)}</span></div>
            <div className="flex items-center justify-between"><span>Probationary Deduction</span><span>{toPeso(result.probationaryDeduction)}</span></div>
            <div className="mt-1 h-px bg-[#dad3c7]" />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Net Pay</span>
              <span>{toPeso(result.netPay)}</span>
            </div>
          </div>

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#5c665f]">Employer Share</h3>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between"><span>SSS (ER)</span><span>{toPeso(result.sssEmployer)}</span></div>
            <div className="flex items-center justify-between"><span>PhilHealth (ER)</span><span>{toPeso(result.philHealthEmployer)}</span></div>
            <div className="flex items-center justify-between"><span>Pag-IBIG (ER)</span><span>{toPeso(result.pagIbigEmployer)}</span></div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface rounded-2xl p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Annual Projection (v1)</h2>
          <p className="caption mt-2 text-sm">
            v1 uses fixed 259 working days for annual regular projection and baseline days x 12 for annual with AHOP.
          </p>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-md bg-[#f4eee4] px-3 py-2">
              <span>Projected Annual Regular</span>
              <strong>{toPeso(result.annualRegularProjection)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-md bg-[#f2e2d5] px-3 py-2">
              <span>Projected Annual With AHOP</span>
              <strong>{toPeso(result.annualWithAhopProjection)}</strong>
            </div>
          </div>
          <p className="caption mt-3 text-xs">
            Employee: {fullName || "(not set)"} • Date Started: {dateStarted}
          </p>
        </div>

        <div className="surface rounded-2xl p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Handbook Reference Fixtures</h2>
          <div className="mt-4 text-sm">
            <p>
              Monthly sample: {toPeso(HANDBOOK_REFERENCE.monthlyExample.regularDaily)} regular vs{" "}
              {toPeso(HANDBOOK_REFERENCE.monthlyExample.withAhop)} with AHOP.
            </p>
            <p className="mt-1">
              Annual sample: {toPeso(HANDBOOK_REFERENCE.annualExample.regularDaily)} regular vs{" "}
              {toPeso(HANDBOOK_REFERENCE.annualExample.withAhop)} with AHOP.
            </p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] border border-[#dad3c7] text-sm">
              <thead className="bg-[#f4eee4]">
                <tr>
                  <th className="border border-[#dad3c7] px-2 py-1 text-left">Gross + AHOP</th>
                  <th className="border border-[#dad3c7] px-2 py-1 text-left">SSS ER/EE</th>
                  <th className="border border-[#dad3c7] px-2 py-1 text-left">PhilHealth ER/EE</th>
                  <th className="border border-[#dad3c7] px-2 py-1 text-left">Pag-IBIG ER/EE</th>
                </tr>
              </thead>
              <tbody>
                {HANDBOOK_REFERENCE.deductionExamples.map((row) => (
                  <tr key={row.gross}>
                    <td className="border border-[#dad3c7] px-2 py-1">{toPeso(row.gross)}</td>
                    <td className="border border-[#dad3c7] px-2 py-1">
                      {toPeso(row.sssEmployer)} / {toPeso(row.sssEmployee)}
                    </td>
                    <td className="border border-[#dad3c7] px-2 py-1">
                      {toPeso(row.philHealthEmployer)} / {toPeso(row.philHealthEmployee)}
                    </td>
                    <td className="border border-[#dad3c7] px-2 py-1">
                      {toPeso(row.pagIbigEmployer)} / {toPeso(row.pagIbigEmployee)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
