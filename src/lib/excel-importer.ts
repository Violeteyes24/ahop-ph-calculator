import * as XLSX from "xlsx";
// import { Decimal } from "@prisma/client/runtime/library";

export interface ExcelEmployeeRow {
  name: string;
  position: string;
  dateOfJoining: Date | null;
  taxable: string;
  disbursementType: "Cash" | "Online";
  salaryType: "AHOP" | string;
  dailyRate: number;
  monthlyRate: number;
  deminimis: number;
  expectedWorkHours: number;
  scheduledWorkDays: number;
  workedDays: number;
  basicPay: number;
  expectedAhop: number;
  rdOtHours: number;
  rdOtPay: number;
  extendedOtHours: number;
  extendedOtPay: number;
  otTotalHours: number;
  otTotalPay: number;
  silDays: number;
  silPay: number;
  slHours: number;
  slPay: number;
  totalLeaves: number;
  totalLeavesPay: number;
  absenceHours: number;
}

export interface ExcelPayrollData {
  periodStart: Date;
  periodEnd: Date;
  employees: ExcelEmployeeRow[];
}

const COLUMN_INDICES = {
  name: 0, // A
  position: 1, // B
  dateOfJoining: 2, // C
  taxable: 3, // D
  disbursementType: 4, // E
  salaryType: 5, // F
  dailyRate: 6, // G
  monthlyRate: 7, // H
  deminimis: 8, // I
  deminimisbMonthly: 9, // J
  expectedWorkHours: 10, // K
  expectedWorkHoursPay: 11, // L
  scheduledWorkDays: 12, // M
  scheduledWorkDaysPay: 13, // N
  workedDays: 14, // O
  basicPay: 15, // P
  expectedAhop: 16, // Q
  rdOtHours: 17, // R
  rdOtPay: 18, // S
  extendedOtHours: 19, // T
  extendedOtPay: 20, // U
  otTotalHours: 21, // V
  otTotalPay: 22, // W
  silDays: 23, // X
  silPay: 24, // Y
  slHours: 25, // Z
  slPay: 26, // AA
  totalLeaves: 27, // AB
  totalLeavesPay: 28, // AC
  absenceHours: 29, // AD
};

function parseExcelDate(dateValue: any): Date | null {
  if (!dateValue) return null;

  if (typeof dateValue === "number") {
    // Excel serial date (days since 1900-01-01, with 1900 leap year bug)
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  if (typeof dateValue === "string") {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function safeParse(value: any, fallback: number = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const num = parseFloat(String(value));
  return isNaN(num) ? fallback : num;
}

function parseString(value: any, fallback: string = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

export async function importExcelPayroll(filePath: string): Promise<ExcelPayrollData> {
  const workbook = XLSX.readFile(filePath);
  const sheetName = "Template Source <Month Date>";

  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(`Sheet "${sheetName}" not found in workbook`);
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: "A" }) as Record<string, any>[];

  // Extract period from header (row 1)
  const headerRow = rows[0];
  const periodStartStr = headerRow["B"] || "";
  const periodEndStr = headerRow["C"] || "";

  // Use provided date or defaults
  const periodStart = new Date(periodStartStr || new Date().toISOString().split("T")[0]);
  const periodEnd = new Date(periodEndStr || new Date().toISOString().split("T")[0]);

  const employees: ExcelEmployeeRow[] = [];

  // Data starts from row 3 (index 2, since row 1 is headers)
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows (if first column is empty)
    const employeeName = parseString(row[String.fromCharCode(65 + COLUMN_INDICES.name)]);
    if (!employeeName) continue;

    const employee: ExcelEmployeeRow = {
      name: employeeName,
      position: parseString(row[String.fromCharCode(65 + COLUMN_INDICES.position)]),
      dateOfJoining: parseExcelDate(row[String.fromCharCode(65 + COLUMN_INDICES.dateOfJoining)]),
      taxable: parseString(row[String.fromCharCode(65 + COLUMN_INDICES.taxable)]),
      disbursementType: parseString(
        row[String.fromCharCode(65 + COLUMN_INDICES.disbursementType)]
      ) as "Cash" | "Online",
      salaryType: parseString(row[String.fromCharCode(65 + COLUMN_INDICES.salaryType)]),
      dailyRate: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.dailyRate)]),
      monthlyRate: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.monthlyRate)]),
      deminimis: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.deminimis)]),
      expectedWorkHours: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.expectedWorkHours)]),
      scheduledWorkDays: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.scheduledWorkDays)]),
      workedDays: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.workedDays)]),
      basicPay: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.basicPay)]),
      expectedAhop: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.expectedAhop)]),
      rdOtHours: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.rdOtHours)]),
      rdOtPay: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.rdOtPay)]),
      extendedOtHours: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.extendedOtHours)]),
      extendedOtPay: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.extendedOtPay)]),
      otTotalHours: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.otTotalHours)]),
      otTotalPay: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.otTotalPay)]),
      silDays: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.silDays)]),
      silPay: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.silPay)]),
      slHours: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.slHours)]),
      slPay: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.slPay)]),
      totalLeaves: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.totalLeaves)]),
      totalLeavesPay: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.totalLeavesPay)]),
      absenceHours: safeParse(row[String.fromCharCode(65 + COLUMN_INDICES.absenceHours)]),
    };

    employees.push(employee);
  }

  return {
    periodStart,
    periodEnd,
    employees,
  };
}

export function excelEmployeeToPayrollInput(employee: ExcelEmployeeRow) {
  return {
    salaryType: employee.salaryType === "AHOP" ? ("DAILY" as const) : ("MONTHLY" as const),
    dailyRate: employee.dailyRate,
    monthlyRate: employee.monthlyRate,
    workingDays: Math.floor(employee.workedDays),
    baselineDays: 23, // Default baseline
    probationaryDeductionPct: 0, // Will need to determine from employee profile
    overtimeRegularHours: employee.rdOtHours,
    overtimeExtendedHours: employee.extendedOtHours,
    silDays: employee.silDays,
    slHours: employee.slHours,
    absenceHours: employee.absenceHours,
  };
}
