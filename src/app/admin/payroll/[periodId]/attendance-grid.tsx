"use client";

import { useState, useTransition } from "react";
import { calculatePayroll } from "@/lib/ahop";
import { saveAttendanceAction, runPayrollAction } from "@/app/actions/payroll";

interface EntryRow {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  salaryType: "DAILY" | "MONTHLY";
  salaryCategory: string;
  dailyRate: number;
  monthlyRate: number;
  probationaryDeductionPct: number;
  deminimisAmount: number;
  workingDays: number;
  overtimeRegularHours: number;
  overtimeExtendedHours: number;
  silDays: number;
  slHours: number;
  absenceHours: number;
  tardinessDeduction: number;
  loanDeductions: number;
  salaryAdjustments: number;
  notes: string;
  calculationError: string | null;
}

function toPeso(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function AttendanceGrid({
  periodId,
  baselineDays,
  entries: initialEntries,
}: {
  periodId: string;
  baselineDays: number;
  entries: EntryRow[];
}) {
  const [entries, setEntries] = useState<EntryRow[]>(initialEntries);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [runError, setRunError] = useState<string | null>(null);
  const [isRunning, startRunTransition] = useTransition();

  function updateEntry(employeeId: string, field: keyof EntryRow, value: number | string) {
    setEntries((prev) =>
      prev.map((e) => (e.employeeId === employeeId ? { ...e, [field]: value } : e))
    );
    setSaveStatus("idle");
  }

  function getPreview(entry: EntryRow) {
    return calculatePayroll({
      salaryType: entry.salaryType,
      dailyRate: entry.dailyRate,
      monthlyRate: entry.monthlyRate,
      workingDays: entry.workingDays,
      baselineDays,
      probationaryDeductionPct: entry.probationaryDeductionPct,
      overtimeRegularHours: entry.overtimeRegularHours,
      overtimeExtendedHours: entry.overtimeExtendedHours,
      silDays: entry.silDays,
      slHours: entry.slHours,
      absenceHours: entry.absenceHours,
      tardinessDeduction: entry.tardinessDeduction,
      loanDeductions: entry.loanDeductions,
      salaryAdjustments: entry.salaryAdjustments,
    });
  }

  async function handleSave() {
    setSaveStatus("saving");
    const result = await saveAttendanceAction(
      periodId,
      entries.map((e) => ({
        employeeId: e.employeeId,
        workingDays: e.workingDays,
        overtimeRegularHours: e.overtimeRegularHours,
        overtimeExtendedHours: e.overtimeExtendedHours,
        silDays: e.silDays,
        slHours: e.slHours,
        absenceHours: e.absenceHours,
        tardinessDeduction: e.tardinessDeduction,
        loanDeductions: e.loanDeductions,
        salaryAdjustments: e.salaryAdjustments,
        notes: e.notes,
      }))
    );
    setSaveStatus(result.success ? "saved" : "error");
  }

  function handleRun() {
    setRunError(null);
    startRunTransition(async () => {
      const result = await runPayrollAction(periodId);
      if (!result?.success) {
        setRunError(result?.error ?? "Failed to run payroll");
      }
    });
  }

  const totals = entries.reduce(
    (acc, entry) => {
      const preview = getPreview(entry);
      return {
        gross: acc.gross + preview.grossWithAhop,
        net: acc.net + preview.netPay,
        deductions:
          acc.deductions +
          preview.sssEmployee +
          preview.philHealthEmployee +
          preview.pagIbigEmployee +
          preview.probationaryDeduction +
          preview.tardinessDeduction +
          preview.loanDeductions,
      };
    },
    { gross: 0, net: 0, deductions: 0 }
  );

  return (
    <div>
      {/* Summary bar */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#ddd6ca] bg-white px-4 py-3">
          <p className="text-xs text-[#6b7280]">Total gross (preview)</p>
          <p className="mt-1 text-lg font-semibold text-[#1a2e1f]">{toPeso(totals.gross)}</p>
        </div>
        <div className="rounded-xl border border-[#ddd6ca] bg-white px-4 py-3">
          <p className="text-xs text-[#6b7280]">Total deductions (preview)</p>
          <p className="mt-1 text-lg font-semibold text-[#1a2e1f]">{toPeso(totals.deductions)}</p>
        </div>
        <div className="rounded-xl border border-[#ddd6ca] bg-[#edf3ee] px-4 py-3">
          <p className="text-xs text-[#5c665f]">Total net pay (preview)</p>
          <p className="mt-1 text-lg font-semibold text-[#1a2e1f]">{toPeso(totals.net)}</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-[#9ca3af]">
          Values update in real-time as you type. Save your progress before running payroll.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="rounded-lg border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f5f0e8] disabled:opacity-60"
          >
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "saved"
              ? "Saved ✓"
              : "Save draft"}
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="rounded-lg bg-[#2f4f3e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#274636] disabled:opacity-60"
          >
            {isRunning ? "Running payroll…" : "Run payroll"}
          </button>
        </div>
      </div>

      {runError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{runError}</p>
      ) : null}

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-[#ddd6ca] bg-white">
        <table className="w-full text-xs">
          <thead className="border-b border-[#ddd6ca] bg-[#f5f0e8]">
            <tr>
              <th className="sticky left-0 bg-[#f5f0e8] px-3 py-3 text-left font-semibold text-[#374151]">
                Employee
              </th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">Days</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">OT Reg hrs</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">OT Ext hrs</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">SIL days</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">SL hrs</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">Absent hrs</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">Tardiness ₱</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">Loans ₱</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">Adj ₱</th>
              <th className="px-3 py-3 text-right font-semibold text-[#2f4f3e]">Gross</th>
              <th className="px-3 py-3 text-right font-semibold text-[#2f4f3e]">Net Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ebe3]">
            {entries.map((entry) => {
              const preview = getPreview(entry);
              return (
                <tr key={entry.employeeId} className="hover:bg-[#faf8f4]">
                  <td className="sticky left-0 bg-white px-3 py-2">
                    <p className="font-medium text-[#1a2e1f]">{entry.employeeName}</p>
                    {entry.position ? (
                      <p className="text-[#9ca3af]">{entry.position}</p>
                    ) : null}
                    {entry.calculationError ? (
                      <p className="text-red-600">{entry.calculationError}</p>
                    ) : null}
                  </td>
                  <td className="px-2 py-1">
                    <NumberInput
                      value={entry.workingDays}
                      onChange={(v) => updateEntry(entry.employeeId, "workingDays", v)}
                      step={1}
                      min={0}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <NumberInput
                      value={entry.overtimeRegularHours}
                      onChange={(v) => updateEntry(entry.employeeId, "overtimeRegularHours", v)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <NumberInput
                      value={entry.overtimeExtendedHours}
                      onChange={(v) => updateEntry(entry.employeeId, "overtimeExtendedHours", v)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <NumberInput
                      value={entry.silDays}
                      onChange={(v) => updateEntry(entry.employeeId, "silDays", v)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <NumberInput
                      value={entry.slHours}
                      onChange={(v) => updateEntry(entry.employeeId, "slHours", v)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <NumberInput
                      value={entry.absenceHours}
                      onChange={(v) => updateEntry(entry.employeeId, "absenceHours", v)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <NumberInput
                      value={entry.tardinessDeduction}
                      onChange={(v) => updateEntry(entry.employeeId, "tardinessDeduction", v)}
                      step={0.01}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <NumberInput
                      value={entry.loanDeductions}
                      onChange={(v) => updateEntry(entry.employeeId, "loanDeductions", v)}
                      step={0.01}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <NumberInput
                      value={entry.salaryAdjustments}
                      onChange={(v) => updateEntry(entry.employeeId, "salaryAdjustments", v)}
                      step={0.01}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-[#374151]">
                    {toPeso(preview.grossWithAhop)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-[#1a2e1f]">
                    {toPeso(preview.netPay)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-[#9ca3af]">
        Gross and Net Pay columns are live previews using the AHOP calculation engine. Run payroll to persist the results.
      </p>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  step = 0.5,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-20 rounded border border-[#e5e7eb] px-2 py-1 text-right text-xs outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
    />
  );
}
