"use client";

import { useState, useTransition } from "react";
import { saveAttendanceAction, runPayrollAction } from "@/app/actions/payroll";
import { calculatePayroll } from "@/lib/ahop";

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
  taxable: boolean;
  deminimisAmount: number;
  workingDays: number;
  workedHours: number;
  expectedWorkHours: number;
  expectedWorkHoursPay: number;
  scheduledWorkDays: number;
  scheduledWorkDaysPay: number;
  overtimeRegularHours: number;
  overtimeExtendedHours: number;
  silDays: number;
  slHours: number;
  absenceHours: number;
  absenceDeduction: number;
  tardinessMinutes: number;
  tardinessDeduction: number;
  aotMinutes: number;
  aotPay: number;
  extraOtPremium: number;
  regularHolidayHours: number;
  regularHolidayPay: number;
  specialHolidayHours: number;
  specialHolidayPay: number;
  totalHolidayPay: number;
  coAhop: number;
  totalAhop: number;
  withholdingTax: number;
  sourceGrossIncome: number;
  loanDeductions: number;
  salaryAdjustments: number;
  notes: string;
  calculationError: string | null;
}

const NUMERIC_FIELDS: Array<{ key: keyof EntryRow; label: string; step?: number; min?: number }> = [
  { key: "workingDays", label: "Days", step: 1 },
  { key: "workedHours", label: "Worked hrs" },
  { key: "expectedWorkHours", label: "Expected hrs" },
  { key: "expectedWorkHoursPay", label: "Expected pay", step: 0.01 },
  { key: "scheduledWorkDays", label: "Sched days" },
  { key: "scheduledWorkDaysPay", label: "Sched pay", step: 0.01 },
  { key: "overtimeRegularHours", label: "OT Reg hrs" },
  { key: "overtimeExtendedHours", label: "OT Ext hrs" },
  { key: "silDays", label: "SIL days" },
  { key: "slHours", label: "SL hrs" },
  { key: "absenceHours", label: "Absent hrs" },
  { key: "absenceDeduction", label: "Absent amt", step: 0.01, min: -999999 },
  { key: "tardinessMinutes", label: "Tardy min" },
  { key: "tardinessDeduction", label: "Tardiness", step: 0.01 },
  { key: "aotMinutes", label: "AOT min" },
  { key: "aotPay", label: "AOT amt", step: 0.01 },
  { key: "extraOtPremium", label: "OT pct", step: 0.01 },
  { key: "regularHolidayHours", label: "Reg hol hrs" },
  { key: "regularHolidayPay", label: "Reg hol amt", step: 0.01 },
  { key: "specialHolidayHours", label: "Spec hol hrs" },
  { key: "specialHolidayPay", label: "Spec hol amt", step: 0.01 },
  { key: "coAhop", label: "CO AHOP", step: 0.01 },
  { key: "withholdingTax", label: "W/H Tax", step: 0.01 },
  { key: "loanDeductions", label: "Loans", step: 0.01 },
  { key: "salaryAdjustments", label: "Adj", step: 0.01, min: -999999 },
];

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
      prev.map((entry) => (entry.employeeId === employeeId ? { ...entry, [field]: value } : entry))
    );
    setSaveStatus("idle");
  }

  function getPreview(entry: EntryRow) {
    return calculatePayroll({
      salaryType: entry.salaryType,
      dailyRate: entry.dailyRate,
      monthlyRate: entry.monthlyRate,
      workingDays: entry.workingDays,
      workedHours: entry.workedHours,
      baselineDays,
      probationaryDeductionPct: entry.probationaryDeductionPct,
      taxable: entry.taxable,
      deMinimisPay: entry.deminimisAmount / 2,
      expectedWorkHours: entry.expectedWorkHours,
      expectedWorkHoursPay: entry.expectedWorkHoursPay,
      scheduledWorkDays: entry.scheduledWorkDays,
      scheduledWorkDaysPay: entry.scheduledWorkDaysPay,
      overtimeRegularHours: entry.overtimeRegularHours,
      overtimeExtendedHours: entry.overtimeExtendedHours,
      silDays: entry.silDays,
      slHours: entry.slHours,
      absenceHours: entry.absenceHours,
      absenceDeduction: entry.absenceDeduction,
      tardinessMinutes: entry.tardinessMinutes,
      tardinessDeduction: entry.tardinessDeduction,
      aotMinutes: entry.aotMinutes,
      aotPay: entry.aotPay,
      extraOtPremium: entry.extraOtPremium,
      regularHolidayHours: entry.regularHolidayHours,
      regularHolidayPay: entry.regularHolidayPay,
      specialHolidayHours: entry.specialHolidayHours,
      specialHolidayPay: entry.specialHolidayPay,
      totalHolidayPay: entry.totalHolidayPay,
      coAhop: entry.coAhop,
      totalAhop: entry.totalAhop,
      withholdingTax: entry.withholdingTax,
      loanDeductions: entry.loanDeductions,
      salaryAdjustments: entry.salaryAdjustments,
    });
  }

  async function handleSave() {
    setSaveStatus("saving");
    const result = await saveAttendanceAction(
      periodId,
      entries.map((entry) => ({
        employeeId: entry.employeeId,
        workingDays: entry.workingDays,
        workedHours: entry.workedHours,
        expectedWorkHours: entry.expectedWorkHours,
        expectedWorkHoursPay: entry.expectedWorkHoursPay,
        scheduledWorkDays: entry.scheduledWorkDays,
        scheduledWorkDaysPay: entry.scheduledWorkDaysPay,
        overtimeRegularHours: entry.overtimeRegularHours,
        overtimeExtendedHours: entry.overtimeExtendedHours,
        silDays: entry.silDays,
        slHours: entry.slHours,
        absenceHours: entry.absenceHours,
        absenceDeduction: entry.absenceDeduction,
        tardinessMinutes: entry.tardinessMinutes,
        tardinessDeduction: entry.tardinessDeduction,
        aotMinutes: entry.aotMinutes,
        aotPay: entry.aotPay,
        extraOtPremium: entry.extraOtPremium,
        regularHolidayHours: entry.regularHolidayHours,
        regularHolidayPay: entry.regularHolidayPay,
        specialHolidayHours: entry.specialHolidayHours,
        specialHolidayPay: entry.specialHolidayPay,
        totalHolidayPay: entry.totalHolidayPay,
        coAhop: entry.coAhop,
        totalAhop: entry.totalAhop,
        withholdingTax: entry.withholdingTax,
        sourceGrossIncome: entry.sourceGrossIncome,
        loanDeductions: entry.loanDeductions,
        salaryAdjustments: entry.salaryAdjustments,
        notes: entry.notes,
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
          preview.withholdingTax +
          preview.loanDeductions,
      };
    },
    { gross: 0, net: 0, deductions: 0 }
  );

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <SummaryCard label="Total gross (preview)" value={toPeso(totals.gross)} />
        <SummaryCard label="Total deductions (preview)" value={toPeso(totals.deductions)} />
        <SummaryCard label="Total net pay (preview)" value={toPeso(totals.net)} highlight />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-[#9ca3af]">
          Values update in real time as you type. Save your progress before running payroll.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="rounded-lg border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f5f0e8] disabled:opacity-60"
          >
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="rounded-lg bg-[#2f4f3e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#274636] disabled:opacity-60"
          >
            {isRunning ? "Running payroll..." : "Run payroll"}
          </button>
        </div>
      </div>

      {runError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{runError}</p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-[#ddd6ca] bg-white">
        <table className="w-full text-xs">
          <thead className="border-b border-[#ddd6ca] bg-[#f5f0e8]">
            <tr>
              <th className="sticky left-0 bg-[#f5f0e8] px-3 py-3 text-left font-semibold text-[#374151]">
                Employee
              </th>
              {NUMERIC_FIELDS.map((field) => (
                <th key={String(field.key)} className="px-3 py-3 text-right font-semibold text-[#374151]">
                  {field.label}
                </th>
              ))}
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
                    {entry.position ? <p className="text-[#9ca3af]">{entry.position}</p> : null}
                    {entry.calculationError ? <p className="text-red-600">{entry.calculationError}</p> : null}
                  </td>
                  {NUMERIC_FIELDS.map((field) => (
                    <td key={String(field.key)} className="px-2 py-1">
                      <NumberInput
                        value={Number(entry[field.key])}
                        onChange={(value) => updateEntry(entry.employeeId, field.key, value)}
                        step={field.step}
                        min={field.min}
                      />
                    </td>
                  ))}
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
        Imported template fields are preserved here. Run payroll to persist them into payroll snapshots.
      </p>
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        highlight ? "border-[#c3d9c9] bg-[#edf3ee]" : "border-[#ddd6ca] bg-white"
      }`}
    >
      <p className="text-xs text-[#6b7280]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#1a2e1f]">{value}</p>
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
  onChange: (value: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      step={step}
      onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
      className="w-20 rounded border border-[#e5e7eb] px-2 py-1 text-right text-xs outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
    />
  );
}
