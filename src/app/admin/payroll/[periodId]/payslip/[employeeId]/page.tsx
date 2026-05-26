import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

function toPeso(value: { toString(): string } | number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function toDateLabel(value: Date | string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default async function AdminPayslipPage({
  params,
}: {
  params: Promise<{ periodId: string; employeeId: string }>;
}) {
  const { periodId, employeeId } = await params;

  const snap = await prisma.payrollSnapshot.findFirst({
    where: { periodId, employeeId },
    include: {
      employee: true,
      period: true,
    },
  });

  if (!snap) notFound();

  const emp = snap.employee;
  const period = snap.period;

  const totalEmployeeDeductions =
    Number(snap.sssEmployee) +
    Number(snap.philHealthEmployee) +
    Number(snap.pagIbigEmployee) +
    Number(snap.probationaryDeduction) +
    Number(snap.tardinessDeduction) +
    Number(snap.loanDeductions);

  const otPay = Number(snap.overtimeRegularPay) + Number(snap.overtimeExtendedPay);
  const leavesPay = Number(snap.silPay) + Number(snap.slPay);

  const generatedOn = new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href={`/admin/payroll/${periodId}/results`}
          className="text-sm text-[#6b7280] hover:text-[#1a2e1f]"
        >
          ← Back to results
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-[#2f4f3e] bg-[#2f4f3e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#274636]"
        >
          Print payslip
        </button>
      </div>

      <div className="rounded-xl border border-[#ddd6ca] bg-white p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between border-b border-[#ddd6ca] pb-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#1a2e1f]">
              Apnea Dynamics Inc.
            </h1>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5c665f]">
              Payslip
            </p>
          </div>
          <div className="text-right text-xs text-[#6b7280]">
            <p>Generated {generatedOn}</p>
            <p>{period?.label ?? `${toDateLabel(snap.periodStart)} – ${toDateLabel(snap.periodEnd)}`}</p>
          </div>
        </div>

        {/* Employee info */}
        <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
          <InfoRow label="Employee" value={emp.fullName} />
          <InfoRow label="Position" value={emp.position ?? "—"} />
          <InfoRow label="Date started" value={toDateLabel(emp.dateStarted)} />
          <InfoRow label="Salary type" value={emp.salaryType} />
          <InfoRow label="Working days" value={String(snap.workingDays)} />
          <InfoRow label="Baseline days" value={String(snap.baselineDays)} />
          <InfoRow label="Payment method" value={emp.paymentMethod} />
          <InfoRow label="Employment stage" value={emp.employmentStage} />
        </div>

        {/* Earnings & Deductions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[#ddd6ca]">
            <div className="border-b border-[#e4ddd1] bg-[#f7f2e8] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#374151]">
              Earnings
            </div>
            <div className="space-y-2 px-3 py-3 text-sm">
              <Row label="Regular pay" value={toPeso(snap.regularPay)} />
              <Row label="AHOP top-up" value={toPeso(snap.ahopTopup)} />
              {otPay > 0 && <Row label="Overtime pay" value={toPeso(otPay)} />}
              {leavesPay > 0 && <Row label="Leave pay" value={toPeso(leavesPay)} />}
              {Number(snap.salaryAdjustments) !== 0 && (
                <Row label="Salary adjustments" value={toPeso(snap.salaryAdjustments)} />
              )}
              <div className="border-t border-[#e4ddd1] pt-2">
                <Row label="Gross pay" value={toPeso(snap.grossWithAhop)} bold />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#ddd6ca]">
            <div className="border-b border-[#e4ddd1] bg-[#edf3ee] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#374151]">
              Deductions
            </div>
            <div className="space-y-2 px-3 py-3 text-sm">
              <Row label="SSS (EE)" value={toPeso(snap.sssEmployee)} />
              <Row label="PhilHealth (EE)" value={toPeso(snap.philHealthEmployee)} />
              <Row label="Pag-IBIG (EE)" value={toPeso(snap.pagIbigEmployee)} />
              {Number(snap.probationaryDeduction) > 0 && (
                <Row label="Probationary deduction" value={toPeso(snap.probationaryDeduction)} />
              )}
              {Number(snap.tardinessDeduction) > 0 && (
                <Row label="Tardiness/Undertime" value={toPeso(snap.tardinessDeduction)} />
              )}
              {Number(snap.loanDeductions) > 0 && (
                <Row label="Loans" value={toPeso(snap.loanDeductions)} />
              )}
              <div className="border-t border-[#e4ddd1] pt-2">
                <Row label="Total deductions" value={toPeso(totalEmployeeDeductions)} bold />
              </div>
            </div>
          </div>
        </div>

        {/* Net pay */}
        <div className="mt-4 rounded-lg border border-[#ddd6ca] bg-[#f8f5ef] px-4 py-3">
          <div className="flex items-center justify-between text-lg font-semibold text-[#1a2e1f]">
            <span>NET PAY</span>
            <span>{toPeso(snap.netPay)}</span>
          </div>
        </div>

        {/* Employer share */}
        <div className="mt-4 rounded-lg border border-[#ddd6ca] px-3 py-3 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#5c665f]">
            Employer contributions (not deducted from pay)
          </p>
          <div className="space-y-1">
            <Row label="SSS (ER)" value={toPeso(snap.sssEmployer)} />
            <Row label="PhilHealth (ER)" value={toPeso(snap.philHealthEmployer)} />
            <Row label="Pag-IBIG (ER)" value={toPeso(snap.pagIbigEmployer)} />
          </div>
        </div>

        {/* YTD AHOP */}
        <div className="mt-4 rounded-lg border border-[#ddd6ca] px-3 py-3 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#5c665f]">
            YTD AHOP tracking
          </p>
          <div className="space-y-1">
            <Row label="Previous YTD AHOP" value={toPeso(snap.previousYtdAhop)} />
            <Row label="This period AHOP" value={toPeso(snap.ahopTopup)} />
            <Row label="Current YTD AHOP" value={toPeso(snap.ytdAhop)} bold />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#9ca3af]">{label}</p>
      <p className="font-medium text-[#1a2e1f]">{value}</p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-[#1a2e1f]" : "text-[#374151]"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
