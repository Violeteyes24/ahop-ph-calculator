import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AttendanceGrid } from "./attendance-grid";

function toDateLabel(value: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default async function AttendancePeriodPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;

  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
    include: {
      attendanceEntries: {
        orderBy: { employee: { fullName: "asc" } },
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              position: true,
              dateStarted: true,
              salaryType: true,
              salaryCategory: true,
              dailyRate: true,
              monthlyRate: true,
              probationaryDeductionPct: true,
              taxable: true,
              paymentMethod: true,
              employmentStage: true,
              deminimisAmount: true,
            },
          },
        },
      },
    },
  });

  if (!period) notFound();

  if (period.status === "COMPLETED") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-[#6b7280]">This period has already been processed.</p>
        <Link
          href={`/admin/payroll/${periodId}/results`}
          className="rounded-lg bg-[#2f4f3e] px-5 py-2 text-sm font-semibold text-white hover:bg-[#274636]"
        >
          View results
        </Link>
      </div>
    );
  }

  const entries = period.attendanceEntries.map((entry) => ({
    id: entry.id,
    employeeId: entry.employee.id,
    employeeName: entry.employee.fullName,
    position: entry.employee.position ?? "",
    dateStarted: entry.employee.dateStarted.toISOString(),
    paymentMethod: entry.employee.paymentMethod,
    employmentStage: entry.employee.employmentStage,
    salaryType: entry.employee.salaryType as "DAILY" | "MONTHLY",
    salaryCategory: entry.employee.salaryCategory,
    dailyRate: Number(entry.employee.dailyRate ?? 0),
    monthlyRate: Number(entry.employee.monthlyRate ?? 0),
    probationaryDeductionPct: Number(entry.employee.probationaryDeductionPct),
    taxable: entry.employee.taxable,
    deminimisAmount: Number(entry.employee.deminimisAmount),
    workingDays: entry.workingDays,
    workedHours: Number(entry.workedHours),
    expectedWorkHours: Number(entry.expectedWorkHours),
    expectedWorkHoursPay: Number(entry.expectedWorkHoursPay),
    scheduledWorkDays: Number(entry.scheduledWorkDays),
    scheduledWorkDaysPay: Number(entry.scheduledWorkDaysPay),
    overtimeRegularHours: Number(entry.overtimeRegularHours),
    overtimeExtendedHours: Number(entry.overtimeExtendedHours),
    silDays: Number(entry.silDays),
    slHours: Number(entry.slHours),
    absenceHours: Number(entry.absenceHours),
    absenceDeduction: Number(entry.absenceDeduction),
    tardinessMinutes: Number(entry.tardinessMinutes),
    tardinessDeduction: Number(entry.tardinessDeduction),
    aotMinutes: Number(entry.aotMinutes),
    aotPay: Number(entry.aotPay),
    extraOtPremium: Number(entry.extraOtPremium),
    regularHolidayHours: Number(entry.regularHolidayHours),
    regularHolidayPay: Number(entry.regularHolidayPay),
    specialHolidayHours: Number(entry.specialHolidayHours),
    specialHolidayPay: Number(entry.specialHolidayPay),
    totalHolidayPay: Number(entry.totalHolidayPay),
    coAhop: Number(entry.coAhop),
    totalAhop: Number(entry.totalAhop),
    withholdingTax: Number(entry.withholdingTax),
    sourceGrossIncome: Number(entry.sourceGrossIncome),
    loanDeductions: Number(entry.loanDeductions),
    salaryAdjustments: Number(entry.salaryAdjustments),
    notes: entry.notes ?? "",
    calculationError: entry.calculationError ?? null,
  }));

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/admin/payroll" className="text-sm text-[#6b7280] hover:text-[#1a2e1f]">
            ← Back to payroll
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a2e1f]">
            {period.label}
          </h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            {toDateLabel(period.periodStart)} – {toDateLabel(period.periodEnd)} ·{" "}
            {period.baselineDays} baseline days · {entries.length} employees
          </p>
        </div>
        <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
          DRAFT
        </span>
      </div>

      <AttendanceGrid
        periodId={periodId}
        periodLabel={period.label}
        periodStart={period.periodStart.toISOString()}
        periodEnd={period.periodEnd.toISOString()}
        baselineDays={period.baselineDays}
        entries={entries}
      />
    </div>
  );
}
