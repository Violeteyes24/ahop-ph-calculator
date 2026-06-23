"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePayroll } from "@/lib/ahop";
import { getContributionRatesForPeriod } from "@/lib/contribution-rates";

const createPeriodSchema = z.object({
  label: z.string().min(1, "Label is required"),
  periodStart: z.string().min(1, "Period start is required"),
  periodEnd: z.string().min(1, "Period end is required"),
  baselineDays: z.string().default("23"),
});

export interface PayrollActionState {
  error?: string;
}

export async function createPeriodAction(
  _prevState: PayrollActionState,
  formData: FormData
): Promise<PayrollActionState> {
  const session = await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = createPeriodSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const periodStart = new Date(data.periodStart);
  const periodEnd = new Date(data.periodEnd);

  if (periodEnd <= periodStart) {
    return { error: "Period end must be after period start" };
  }

  const activeEmployees = await prisma.employeeProfile.findMany({
    where: { isActive: true },
    orderBy: { fullName: "asc" },
  });

  const period = await prisma.payrollPeriod.create({
    data: {
      label: data.label,
      periodStart,
      periodEnd,
      baselineDays: parseInt(data.baselineDays),
      createdBy: session.userId,
      attendanceEntries: {
        create: activeEmployees.map((emp) => ({
          employeeId: emp.id,
          workingDays: parseInt(data.baselineDays),
        })),
      },
    },
  });

  revalidatePath("/admin/payroll");
  redirect(`/admin/payroll/${period.id}`);
}

export async function saveAttendanceAction(
  periodId: string,
  entries: Array<{
    employeeId: string;
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
  }>
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const period = await prisma.payrollPeriod.findUnique({ where: { id: periodId } });
  if (!period) return { success: false, error: "Period not found" };
  if (period.status !== "DRAFT") return { success: false, error: "Period is no longer editable" };

  await Promise.all(
    entries.map((entry) =>
      prisma.attendanceEntry.upsert({
        where: {
          periodId_employeeId: {
            periodId,
            employeeId: entry.employeeId,
          },
        },
        update: {
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
        },
        create: {
          periodId,
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
        },
      })
    )
  );

  revalidatePath(`/admin/payroll/${periodId}`);
  return { success: true };
}

export async function runPayrollAction(periodId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
    include: {
      attendanceEntries: {
        include: { employee: true },
      },
    },
  });

  if (!period) return { success: false, error: "Period not found" };
  if (period.status !== "DRAFT") return { success: false, error: "Payroll has already been run for this period" };

  const contributionRates = await getContributionRatesForPeriod(period.periodStart, period.periodEnd);
  const computedSnapshots = [];
  const calculationErrors: Array<{ entryId: string; message: string }> = [];

  for (const entry of period.attendanceEntries) {
    const emp = entry.employee;

    try {
      // Get previous YTD AHOP from last snapshot before this period
      const prevSnapshot = await prisma.payrollSnapshot.findFirst({
        where: {
          employeeId: emp.id,
          periodEnd: { lt: period.periodStart },
        },
        orderBy: { periodEnd: "desc" },
      });

      const previousYtdAhop = prevSnapshot ? Number(prevSnapshot.ytdAhop) : 0;

      const input = {
        salaryType: emp.salaryType === "DAILY" ? ("DAILY" as const) : ("MONTHLY" as const),
        dailyRate: Number(emp.dailyRate ?? 0),
        monthlyRate: Number(emp.monthlyRate ?? 0),
        workingDays: entry.workingDays,
        workedHours: Number(entry.workedHours),
        baselineDays: period.baselineDays,
        probationaryDeductionPct: Number(emp.probationaryDeductionPct),
        taxable: emp.taxable,
        deMinimisPay: Number(emp.deminimisAmount) / 2,
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
        loanDeductions: Number(entry.loanDeductions),
        salaryAdjustments: Number(entry.salaryAdjustments),
        previousYtdAhop,
        contributionRates,
      };

      const result = calculatePayroll(input);

      computedSnapshots.push({
        employeeId: emp.id,
        periodId,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        workingDays: entry.workingDays,
        workedHours: Number(entry.workedHours),
        baselineDays: period.baselineDays,
        regularPay: result.regularPay,
        ahopTopup: result.ahopTopup,
        grossWithAhop: result.grossWithAhop,
        deMinimisPay: result.deMinimisPay,
        sssEmployee: result.sssEmployee,
        sssEmployer: result.sssEmployer,
        philHealthEmployee: result.philHealthEmployee,
        philHealthEmployer: result.philHealthEmployer,
        pagIbigEmployee: result.pagIbigEmployee,
        pagIbigEmployer: result.pagIbigEmployer,
        probationaryDeduction: result.probationaryDeduction,
        netPay: result.netPay,
        overtimeRegularHours: Number(entry.overtimeRegularHours),
        overtimeExtendedHours: Number(entry.overtimeExtendedHours),
        overtimeRegularPay: result.overtimeRegularPay,
        overtimeExtendedPay: result.overtimeExtendedPay,
        otTotalHours: result.otTotalHours,
        otTotalPay: result.otTotalPay,
        silDays: Number(entry.silDays),
        silPay: result.silPay,
        slHours: Number(entry.slHours),
        slPay: result.slPay,
        totalLeaves: result.totalLeaves,
        totalLeavesPay: result.totalLeavesPay,
        absenceHours: Number(entry.absenceHours),
        absencePay: result.absencePay,
        absenceDeduction: result.absenceDeduction,
        tardinessMinutes: result.tardinessMinutes,
        tardinessDeduction: result.tardinessDeduction,
        aotMinutes: result.aotMinutes,
        aotPay: result.aotPay,
        extraOtPremium: result.extraOtPremium,
        regularHolidayHours: result.regularHolidayHours,
        regularHolidayPay: result.regularHolidayPay,
        specialHolidayHours: result.specialHolidayHours,
        specialHolidayPay: result.specialHolidayPay,
        totalHolidayPay: result.totalHolidayPay,
        coAhop: result.coAhop,
        totalAhop: result.totalAhop,
        withholdingTax: result.withholdingTax,
        loanDeductions: result.loanDeductions,
        salaryAdjustments: result.salaryAdjustments,
        ytdAhop: result.ytdAhop,
        previousYtdAhop,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      calculationErrors.push({ entryId: entry.id, message });
    }
  }

  if (calculationErrors.length > 0) {
    await Promise.all(
      calculationErrors.map((error) =>
        prisma.attendanceEntry.update({
          where: { id: error.entryId },
          data: { calculationError: error.message },
        })
      )
    );
    revalidatePath(`/admin/payroll/${periodId}`);
    return {
      success: false,
      error: `${calculationErrors.length} employee calculation failed. Review row errors before running payroll again.`,
    };
  }

  await prisma.$transaction([
    prisma.payrollSnapshot.deleteMany({ where: { periodId } }),
    prisma.payrollSnapshot.createMany({ data: computedSnapshots }),
    prisma.attendanceEntry.updateMany({
      where: { periodId },
      data: { calculationError: null },
    }),
    prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: "COMPLETED", processedAt: new Date() },
    }),
  ]);

  revalidatePath("/admin/payroll");
  revalidatePath("/admin/dashboard");
  redirect(`/admin/payroll/${periodId}/results`);
}
