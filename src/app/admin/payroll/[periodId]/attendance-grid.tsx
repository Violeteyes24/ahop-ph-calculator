"use client";

import { useState, useTransition } from "react";
import { saveAttendanceAction, runPayrollAction } from "@/app/actions/payroll";
import { PrintButton } from "@/components/payroll/print-button";
import { TemplatePayslip } from "@/components/payroll/template-payslip";
import { calculatePayroll, type PayrollResult } from "@/lib/ahop";

interface EntryRow {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  dateStarted: string;
  paymentMethod: string;
  employmentStage: string;
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

type NumberField = Extract<
  keyof EntryRow,
  | "workingDays"
  | "workedHours"
  | "expectedWorkHours"
  | "expectedWorkHoursPay"
  | "scheduledWorkDays"
  | "scheduledWorkDaysPay"
  | "overtimeRegularHours"
  | "overtimeExtendedHours"
  | "silDays"
  | "slHours"
  | "absenceHours"
  | "absenceDeduction"
  | "tardinessMinutes"
  | "tardinessDeduction"
  | "aotMinutes"
  | "aotPay"
  | "extraOtPremium"
  | "regularHolidayHours"
  | "regularHolidayPay"
  | "specialHolidayHours"
  | "specialHolidayPay"
  | "coAhop"
  | "withholdingTax"
  | "loanDeductions"
  | "salaryAdjustments"
>;

interface FieldDef {
  key: NumberField;
  label: string;
  step?: number;
  min?: number;
}

const FIELD_GROUPS: Array<{ title: string; description: string; fields: FieldDef[] }> = [
  {
    title: "Work Basis",
    description: "Hours, scheduled days, and base-period source values.",
    fields: [
      { key: "workingDays", label: "Worked days", step: 1 },
      { key: "workedHours", label: "Worked hours" },
      { key: "expectedWorkHours", label: "Expected hours" },
      { key: "expectedWorkHoursPay", label: "Expected pay", step: 0.01 },
      { key: "scheduledWorkDays", label: "Scheduled days" },
      { key: "scheduledWorkDaysPay", label: "Scheduled pay", step: 0.01 },
    ],
  },
  {
    title: "Time Adjustments",
    description: "Overtime, leaves, absence, and tardiness.",
    fields: [
      { key: "overtimeRegularHours", label: "RD OT hours" },
      { key: "overtimeExtendedHours", label: "Extended OT hours" },
      { key: "silDays", label: "SIL days" },
      { key: "slHours", label: "SL hours" },
      { key: "absenceHours", label: "Absence hours" },
      { key: "absenceDeduction", label: "Absence amount", step: 0.01, min: -999999 },
      { key: "tardinessMinutes", label: "Tardy minutes" },
      { key: "tardinessDeduction", label: "Tardy amount", step: 0.01 },
    ],
  },
  {
    title: "AHOP And Deductions",
    description: "Holiday/AOT breakdown, payroll deductions, and adjustments.",
    fields: [
      { key: "aotMinutes", label: "AOT minutes" },
      { key: "aotPay", label: "AOT pay", step: 0.01 },
      { key: "extraOtPremium", label: "OT premium", step: 0.01 },
      { key: "regularHolidayHours", label: "Regular holiday hours" },
      { key: "regularHolidayPay", label: "Regular holiday pay", step: 0.01 },
      { key: "specialHolidayHours", label: "Special holiday hours" },
      { key: "specialHolidayPay", label: "Special holiday pay", step: 0.01 },
      { key: "coAhop", label: "CO AHOP", step: 0.01 },
      { key: "withholdingTax", label: "W/H tax", step: 0.01 },
      { key: "loanDeductions", label: "Loans", step: 0.01 },
      { key: "salaryAdjustments", label: "Adjustments", step: 0.01, min: -999999 },
    ],
  },
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
  periodLabel,
  periodStart,
  periodEnd,
  baselineDays,
  entries: initialEntries,
}: {
  periodId: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  baselineDays: number;
  entries: EntryRow[];
}) {
  const [entries, setEntries] = useState<EntryRow[]>(initialEntries);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEntries[0]?.employeeId ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [runError, setRunError] = useState<string | null>(null);
  const [isRunning, startRunTransition] = useTransition();

  function updateEntry(employeeId: string, field: NumberField | "notes", value: number | string) {
    setEntries((prev) =>
      prev.map((entry) => (entry.employeeId === employeeId ? { ...entry, [field]: value } : entry))
    );
    setSaveStatus("idle");
  }

  function getPreview(entry: EntryRow): PayrollResult {
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

  const selectedEntry = entries.find((entry) => entry.employeeId === selectedEmployeeId) ?? entries[0];
  const selectedPreview = selectedEntry ? getPreview(selectedEntry) : null;

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
    <div className="space-y-6">
      <div className="print-exclude grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Total gross preview" value={toPeso(totals.gross)} />
          <SummaryCard label="Total deductions preview" value={toPeso(totals.deductions)} />
          <SummaryCard label="Total net pay preview" value={toPeso(totals.net)} highlight />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
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
        <p className="print-exclude rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{runError}</p>
      ) : null}

      {selectedEntry && selectedPreview ? (
        <section className="rounded-xl border border-[#ddd6ca] bg-white p-4">
          <div className="print-exclude mb-4 flex flex-col gap-3 border-b border-[#eee8de] pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5c665f]">
                Internal Payslip Preview Generator
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[#1a2e1f]">Draft payslip preview</h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Preview is based on unsaved draft values below. Save draft before running payroll.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedEntry.employeeId}
                onChange={(event) => setSelectedEmployeeId(event.target.value)}
                className="min-w-64 rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
              >
                {entries.map((entry) => (
                  <option key={entry.employeeId} value={entry.employeeId}>
                    {entry.employeeName}
                  </option>
                ))}
              </select>
              <PrintButton label="Print preview" />
            </div>
          </div>

          <TemplatePayslip
            employee={{
              fullName: selectedEntry.employeeName,
              position: selectedEntry.position || null,
              dateStarted: selectedEntry.dateStarted,
              salaryType: selectedEntry.salaryType,
              paymentMethod: selectedEntry.paymentMethod,
              employmentStage: selectedEntry.employmentStage,
              deminimisAmount: selectedEntry.deminimisAmount,
            }}
            snapshot={{
              periodStart,
              periodEnd,
              workingDays: selectedEntry.workingDays,
              regularPay: selectedPreview.regularPay,
              ahopTopup: selectedPreview.ahopTopup,
              grossWithAhop: selectedPreview.grossWithAhop,
              deMinimisPay: selectedPreview.deMinimisPay,
              sssEmployee: selectedPreview.sssEmployee,
              sssEmployer: selectedPreview.sssEmployer,
              philHealthEmployee: selectedPreview.philHealthEmployee,
              philHealthEmployer: selectedPreview.philHealthEmployer,
              pagIbigEmployee: selectedPreview.pagIbigEmployee,
              pagIbigEmployer: selectedPreview.pagIbigEmployer,
              probationaryDeduction: selectedPreview.probationaryDeduction,
              netPay: selectedPreview.netPay,
              overtimeRegularHours: selectedEntry.overtimeRegularHours,
              overtimeExtendedHours: selectedEntry.overtimeExtendedHours,
              overtimeRegularPay: selectedPreview.overtimeRegularPay,
              overtimeExtendedPay: selectedPreview.overtimeExtendedPay,
              otTotalHours: selectedPreview.otTotalHours,
              otTotalPay: selectedPreview.otTotalPay,
              silDays: selectedEntry.silDays,
              silPay: selectedPreview.silPay,
              slHours: selectedEntry.slHours,
              slPay: selectedPreview.slPay,
              totalLeaves: selectedPreview.totalLeaves,
              totalLeavesPay: selectedPreview.totalLeavesPay,
              absenceHours: selectedEntry.absenceHours,
              absencePay: selectedPreview.absencePay,
              absenceDeduction: selectedPreview.absenceDeduction,
              tardinessMinutes: selectedPreview.tardinessMinutes,
              tardinessDeduction: selectedPreview.tardinessDeduction,
              aotMinutes: selectedPreview.aotMinutes,
              aotPay: selectedPreview.aotPay,
              extraOtPremium: selectedPreview.extraOtPremium,
              regularHolidayHours: selectedPreview.regularHolidayHours,
              regularHolidayPay: selectedPreview.regularHolidayPay,
              specialHolidayHours: selectedPreview.specialHolidayHours,
              specialHolidayPay: selectedPreview.specialHolidayPay,
              totalHolidayPay: selectedPreview.totalHolidayPay,
              coAhop: selectedPreview.coAhop,
              totalAhop: selectedPreview.totalAhop,
              withholdingTax: selectedPreview.withholdingTax,
              loanDeductions: selectedPreview.loanDeductions,
              salaryAdjustments: selectedPreview.salaryAdjustments,
              ytdAhop: selectedPreview.ytdAhop,
              previousYtdAhop: 0,
            }}
            periodLabel={periodLabel}
          />
        </section>
      ) : null}

      <section className="print-exclude space-y-4">
        {entries.map((entry) => {
          const preview = getPreview(entry);
          return (
            <article key={entry.employeeId} className="rounded-xl border border-[#ddd6ca] bg-white">
              <header className="flex flex-col gap-3 border-b border-[#eee8de] bg-[#fbf8f2] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#1a2e1f]">{entry.employeeName}</h2>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {entry.position || "No position"} · {entry.salaryType} · {entry.paymentMethod}
                  </p>
                  {entry.calculationError ? (
                    <p className="mt-1 text-xs text-red-600">{entry.calculationError}</p>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-2 text-right text-xs">
                  <MiniTotal label="Gross" value={toPeso(preview.grossWithAhop)} />
                  <MiniTotal label="Net" value={toPeso(preview.netPay)} strong />
                  <button
                    type="button"
                    onClick={() => setSelectedEmployeeId(entry.employeeId)}
                    className="rounded-lg border border-[#2f4f3e] px-3 py-2 text-xs font-semibold text-[#2f4f3e] hover:bg-[#edf3ee]"
                  >
                    Preview payslip
                  </button>
                </div>
              </header>

              <div className="grid gap-4 p-4 xl:grid-cols-3">
                {FIELD_GROUPS.map((group) => (
                  <section key={group.title} className="rounded-lg border border-[#ebe5dc] p-3">
                    <h3 className="text-sm font-semibold text-[#374151]">{group.title}</h3>
                    <p className="mt-1 text-xs text-[#9ca3af]">{group.description}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {group.fields.map((field) => (
                        <NumberInput
                          key={field.key}
                          label={field.label}
                          value={entry[field.key]}
                          onChange={(value) => updateEntry(entry.employeeId, field.key, value)}
                          step={field.step}
                          min={field.min}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <div className="border-t border-[#eee8de] px-4 py-3">
                <label className="grid gap-1.5 text-xs font-medium text-[#6b7280]">
                  Notes
                  <textarea
                    value={entry.notes}
                    onChange={(event) => updateEntry(entry.employeeId, "notes", event.target.value)}
                    rows={2}
                    className="w-full resize-y rounded-lg border border-[#d1d5db] px-3 py-2 text-sm text-[#374151] outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
                  />
                </label>
              </div>
            </article>
          );
        })}
      </section>
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

function MiniTotal({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#9ca3af]">{label}</p>
      <p className={`mt-1 whitespace-nowrap ${strong ? "font-semibold text-[#1a2e1f]" : "text-[#374151]"}`}>
        {value}
      </p>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step = 0.5,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-[#6b7280]">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
        className="h-9 w-full rounded-lg border border-[#e5e7eb] px-2 text-right text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
      />
    </label>
  );
}
