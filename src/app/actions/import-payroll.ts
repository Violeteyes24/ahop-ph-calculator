"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { calculatePayroll } from "@/lib/ahop";
import {
  deserializeExcelPayrollData,
  excelEmployeeToPayrollInput,
  importExcelPayrollBuffer,
  serializeExcelPayrollData,
  type ExcelEmployeeRow,
  type SerializedExcelPayrollData,
} from "@/lib/excel-importer";
import { getContributionRatesForPeriod } from "@/lib/contribution-rates";
import { generateReconciliationReport, reconcilePayroll } from "@/lib/payroll-reconciliation";
import { prisma } from "@/lib/prisma";

export interface ImportPayrollActionState {
  error?: string;
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function getDefaultLabel(periodStart: Date, periodEnd: Date): string {
  const start = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(periodStart);
  const end = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(periodEnd);
  return `${start}-${end}`;
}

function getBaselineDays(employees: ExcelEmployeeRow[]): number {
  const maxScheduledDays = Math.max(...employees.map((employee) => Math.floor(employee.scheduledWorkDays || 0)));
  return maxScheduledDays > 0 ? maxScheduledDays : 23;
}

function getWarnings(employees: ExcelEmployeeRow[]): string[] {
  const warnings: string[] = [];
  const seen = new Map<string, number>();

  for (const employee of employees) {
    const key = normalizeName(employee.name);
    seen.set(key, (seen.get(key) ?? 0) + 1);

    if (!employee.dateOfJoining) {
      warnings.push(`${employee.name}: missing date of joining; import will use the period start date.`);
    }
    if (employee.salaryType === "AHOP" && employee.dailyRate <= 0) {
      warnings.push(`${employee.name}: AHOP/daily employee has no daily rate.`);
    }
    if (employee.salaryType !== "AHOP" && employee.monthlyRate <= 0) {
      warnings.push(`${employee.name}: monthly/non-AHOP employee has no monthly rate.`);
    }
  }

  for (const [name, count] of seen.entries()) {
    if (count > 1) warnings.push(`Duplicate employee name in workbook: ${name}.`);
  }

  return warnings;
}

export async function importPayrollWorkbookAction(
  _prevState: ImportPayrollActionState,
  formData: FormData
): Promise<ImportPayrollActionState> {
  const session = await requireAdmin();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an Excel workbook to import." };
  }

  if (!file.name.toLowerCase().endsWith(".xlsx") && !file.name.toLowerCase().endsWith(".xls")) {
    return { error: "Upload an .xlsx or .xls workbook." };
  }

  try {
    const data = await importExcelPayrollBuffer(await file.arrayBuffer());
    if (data.employees.length === 0) {
      return { error: "No employee rows were found in the workbook." };
    }

    const contributionRates = await getContributionRatesForPeriod(data.periodStart, data.periodEnd);
    const calculatedPayrolls = new Map();
    for (const employee of data.employees) {
      calculatedPayrolls.set(
        employee.name,
        calculatePayroll({
          ...excelEmployeeToPayrollInput(employee),
          baselineDays: getBaselineDays(data.employees),
          contributionRates,
        })
      );
    }

    const reconciliation = reconcilePayroll(
      data.employees,
      calculatedPayrolls,
      data.periodStart,
      data.periodEnd
    );
    const majorDifferences = reconciliation.differences.filter((diff) => diff.status === "MAJOR_DIFF");
    const warnings = getWarnings(data.employees);
    if (majorDifferences.length > 0) {
      warnings.push(`${majorDifferences.length} major reconciliation differences found.`);
    }

    const batch = await prisma.payrollImportBatch.create({
      data: {
        fileName: file.name,
        parsedRows: serializeExcelPayrollData(data) as unknown as Prisma.InputJsonValue,
        warnings: warnings as Prisma.InputJsonValue,
        reconciliation: {
          ...JSON.parse(JSON.stringify(reconciliation)),
          text: generateReconciliationReport(reconciliation),
        } as Prisma.InputJsonValue,
        createdBy: session.userId,
      },
    });

    revalidatePath("/admin/payroll/import");
    redirect(`/admin/payroll/import/${batch.id}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to import workbook.",
    };
  }
}

export async function confirmPayrollImportAction(batchId: string, formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();

  const batch = await prisma.payrollImportBatch.findUnique({
    where: { id: batchId },
    include: { period: true },
  });

  if (!batch) {
    redirect("/admin/payroll/import");
  }

  if (batch.status === "PERSISTED" && batch.periodId) {
    redirect(`/admin/payroll/${batch.periodId}`);
  }

  const data = deserializeExcelPayrollData(batch.parsedRows as unknown as SerializedExcelPayrollData);
  const periodLabel = label || getDefaultLabel(data.periodStart, data.periodEnd);
  const baselineDays = getBaselineDays(data.employees);

  const period = await prisma.$transaction(async (tx) => {
    const existingDraft = await tx.payrollPeriod.findFirst({
      where: {
        status: "DRAFT",
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
      },
    });

    const payrollPeriod =
      existingDraft ??
      (await tx.payrollPeriod.create({
        data: {
          label: periodLabel,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          baselineDays,
          createdBy: session.userId,
        },
      }));

    if (existingDraft && existingDraft.label !== periodLabel) {
      await tx.payrollPeriod.update({
        where: { id: existingDraft.id },
        data: { label: periodLabel, baselineDays },
      });
    }

    const employees = await tx.employeeProfile.findMany();
    const employeesByName = new Map(employees.map((employee) => [normalizeName(employee.fullName), employee]));

    for (const row of data.employees) {
      const salaryType = row.salaryType === "AHOP" ? "DAILY" : "MONTHLY";
      const salaryCategory = row.salaryType === "AHOP" ? "AHOP" : "NON_AHOP";
      const existingEmployee = employeesByName.get(normalizeName(row.name));
      const employeeData = {
        fullName: row.name,
        position: row.position || null,
        dateStarted: row.dateOfJoining ?? data.periodStart,
        salaryType,
        salaryCategory,
        dailyRate: row.dailyRate || null,
        monthlyRate: row.monthlyRate || null,
        paymentMethod: row.disbursementType === "Cash" ? "CASH" : "BANK",
        deminimisAmount: row.deminimis || 0,
        isActive: true,
      } as const;

      const employee = existingEmployee
        ? await tx.employeeProfile.update({
            where: { id: existingEmployee.id },
            data: employeeData,
          })
        : await tx.employeeProfile.create({
            data: {
              ...employeeData,
              employmentStage: "PROBATIONARY",
              probationaryDeductionPct: 0,
            },
          });

      employeesByName.set(normalizeName(employee.fullName), employee);

      await tx.attendanceEntry.upsert({
        where: {
          periodId_employeeId: {
            periodId: payrollPeriod.id,
            employeeId: employee.id,
          },
        },
        update: {
          workingDays: Math.floor(row.workedDays),
          overtimeRegularHours: row.rdOtHours,
          overtimeExtendedHours: row.extendedOtHours,
          silDays: row.silDays,
          slHours: row.slHours,
          absenceHours: row.absenceHours,
          tardinessDeduction: 0,
          loanDeductions: 0,
          salaryAdjustments: 0,
          notes: `Imported from ${batch.fileName}`,
          calculationError: null,
        },
        create: {
          periodId: payrollPeriod.id,
          employeeId: employee.id,
          workingDays: Math.floor(row.workedDays),
          overtimeRegularHours: row.rdOtHours,
          overtimeExtendedHours: row.extendedOtHours,
          silDays: row.silDays,
          slHours: row.slHours,
          absenceHours: row.absenceHours,
          notes: `Imported from ${batch.fileName}`,
        },
      });
    }

    await tx.payrollImportBatch.update({
      where: { id: batch.id },
      data: {
        status: "PERSISTED",
        periodId: payrollPeriod.id,
      },
    });

    return payrollPeriod;
  });

  revalidatePath("/admin/payroll");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/payroll/import");
  redirect(`/admin/payroll/${period.id}`);
}
