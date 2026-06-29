import * as XLSX from "xlsx";
import { DEFAULT_MONTHLY_AHOP_BASELINE_DAYS } from "@/lib/payroll-draft";
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
  deMinimisBiMonthly: number;
  expectedWorkHours: number;
  expectedWorkHoursPay: number;
  scheduledWorkDays: number;
  scheduledWorkDaysPay: number;
  workedHours: number;
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
  salaryAdjustments: number;
  grossIncome: number;
  sss: number;
  philHealth: number;
  pagIbig: number;
  withholdingTax: number;
  loans: number;
}

export interface ExcelPayrollData {
  periodStart: Date;
  periodEnd: Date;
  employees: ExcelEmployeeRow[];
}

export interface SerializedExcelEmployeeRow extends Omit<ExcelEmployeeRow, "dateOfJoining"> {
  dateOfJoining: string | null;
}

export interface SerializedExcelPayrollData {
  periodStart: string;
  periodEnd: string;
  employees: SerializedExcelEmployeeRow[];
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
  deMinimisBiMonthly: 9, // J
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
  absenceDeduction: 30, // AE
  tardinessMinutes: 31, // AF
  tardinessDeduction: 32, // AG
  aotMinutes: 33, // AH
  aotPay: 34, // AI
  extraOtPremium: 35, // AJ
  regularHolidayHours: 36, // AK
  regularHolidayPay: 37, // AL
  specialHolidayHours: 38, // AM
  specialHolidayPay: 39, // AN
  totalHolidayPay: 40, // AO
  coAhop: 41, // AP
  totalAhop: 42, // AQ
  salaryAdjustments: 43, // AR
  grossIncome: 44, // AS
  sss: 45, // AT
  philHealth: 46, // AU
  pagIbig: 47, // AV
  withholdingTax: 48, // AW
  loans: 49, // AX
};

function columnName(index: number): string {
  let dividend = index + 1;
  let name = "";

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return name;
}

function cell(row: Record<string, unknown>, index: number): unknown {
  return row[columnName(index)];
}

function parseExcelDate(dateValue: unknown): Date | null {
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

function safeParse(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = typeof value === "string" ? value.replace(/,/g, "").replace(/[^\d.-]/g, "") : value;
  const num = parseFloat(String(normalized));
  return isNaN(num) ? fallback : num;
}

function parseString(value: unknown, fallback: string = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function normalizeWorkedDays(workedHoursOrDays: number): number {
  if (workedHoursOrDays > 31) return workedHoursOrDays / 8;
  return workedHoursOrDays;
}

function parsePayrollWorkbook(workbook: XLSX.WorkBook): ExcelPayrollData {
  const sheetName = "Template Source <Month Date>";

  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(`Sheet "${sheetName}" not found in workbook`);
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: "A" }) as Record<string, unknown>[];

  // Extract period from header (row 1)
  const headerRow = rows[0];
  const fallbackDate = new Date();
  const periodStart = parseExcelDate(headerRow["B"]) ?? fallbackDate;
  const periodEnd = parseExcelDate(headerRow["C"]) ?? fallbackDate;

  const employees: ExcelEmployeeRow[] = [];

  // Data starts from row 3 (index 2, since row 1 is headers)
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows (if first column is empty)
    const employeeName = parseString(cell(row, COLUMN_INDICES.name));
    if (!employeeName) continue;

    const workedHours = safeParse(cell(row, COLUMN_INDICES.workedDays));

    const employee: ExcelEmployeeRow = {
      name: employeeName,
      position: parseString(cell(row, COLUMN_INDICES.position)),
      dateOfJoining: parseExcelDate(cell(row, COLUMN_INDICES.dateOfJoining)),
      taxable: parseString(cell(row, COLUMN_INDICES.taxable)),
      disbursementType: parseString(cell(row, COLUMN_INDICES.disbursementType)) as "Cash" | "Online",
      salaryType: parseString(cell(row, COLUMN_INDICES.salaryType)),
      dailyRate: safeParse(cell(row, COLUMN_INDICES.dailyRate)),
      monthlyRate: safeParse(cell(row, COLUMN_INDICES.monthlyRate)),
      deminimis: safeParse(cell(row, COLUMN_INDICES.deminimis)),
      deMinimisBiMonthly: safeParse(cell(row, COLUMN_INDICES.deMinimisBiMonthly)),
      expectedWorkHours: safeParse(cell(row, COLUMN_INDICES.expectedWorkHours)),
      expectedWorkHoursPay: safeParse(cell(row, COLUMN_INDICES.expectedWorkHoursPay)),
      scheduledWorkDays: safeParse(cell(row, COLUMN_INDICES.scheduledWorkDays)),
      scheduledWorkDaysPay: safeParse(cell(row, COLUMN_INDICES.scheduledWorkDaysPay)),
      workedHours,
      workedDays: normalizeWorkedDays(workedHours),
      basicPay: safeParse(cell(row, COLUMN_INDICES.basicPay)),
      expectedAhop: safeParse(cell(row, COLUMN_INDICES.expectedAhop)),
      rdOtHours: safeParse(cell(row, COLUMN_INDICES.rdOtHours)),
      rdOtPay: safeParse(cell(row, COLUMN_INDICES.rdOtPay)),
      extendedOtHours: safeParse(cell(row, COLUMN_INDICES.extendedOtHours)),
      extendedOtPay: safeParse(cell(row, COLUMN_INDICES.extendedOtPay)),
      otTotalHours: safeParse(cell(row, COLUMN_INDICES.otTotalHours)),
      otTotalPay: safeParse(cell(row, COLUMN_INDICES.otTotalPay)),
      silDays: safeParse(cell(row, COLUMN_INDICES.silDays)),
      silPay: safeParse(cell(row, COLUMN_INDICES.silPay)),
      slHours: safeParse(cell(row, COLUMN_INDICES.slHours)),
      slPay: safeParse(cell(row, COLUMN_INDICES.slPay)),
      totalLeaves: safeParse(cell(row, COLUMN_INDICES.totalLeaves)),
      totalLeavesPay: safeParse(cell(row, COLUMN_INDICES.totalLeavesPay)),
      absenceHours: safeParse(cell(row, COLUMN_INDICES.absenceHours)),
      absenceDeduction: safeParse(cell(row, COLUMN_INDICES.absenceDeduction)),
      tardinessMinutes: safeParse(cell(row, COLUMN_INDICES.tardinessMinutes)),
      tardinessDeduction: safeParse(cell(row, COLUMN_INDICES.tardinessDeduction)),
      aotMinutes: safeParse(cell(row, COLUMN_INDICES.aotMinutes)),
      aotPay: safeParse(cell(row, COLUMN_INDICES.aotPay)),
      extraOtPremium: safeParse(cell(row, COLUMN_INDICES.extraOtPremium)),
      regularHolidayHours: safeParse(cell(row, COLUMN_INDICES.regularHolidayHours)),
      regularHolidayPay: safeParse(cell(row, COLUMN_INDICES.regularHolidayPay)),
      specialHolidayHours: safeParse(cell(row, COLUMN_INDICES.specialHolidayHours)),
      specialHolidayPay: safeParse(cell(row, COLUMN_INDICES.specialHolidayPay)),
      totalHolidayPay: safeParse(cell(row, COLUMN_INDICES.totalHolidayPay)),
      coAhop: safeParse(cell(row, COLUMN_INDICES.coAhop)),
      totalAhop: safeParse(cell(row, COLUMN_INDICES.totalAhop)),
      salaryAdjustments: safeParse(cell(row, COLUMN_INDICES.salaryAdjustments)),
      grossIncome: safeParse(cell(row, COLUMN_INDICES.grossIncome)),
      sss: safeParse(cell(row, COLUMN_INDICES.sss)),
      philHealth: safeParse(cell(row, COLUMN_INDICES.philHealth)),
      pagIbig: safeParse(cell(row, COLUMN_INDICES.pagIbig)),
      withholdingTax: safeParse(cell(row, COLUMN_INDICES.withholdingTax)),
      loans: safeParse(cell(row, COLUMN_INDICES.loans)),
    };

    employees.push(employee);
  }

  return {
    periodStart,
    periodEnd,
    employees,
  };
}

export async function importExcelPayroll(filePath: string): Promise<ExcelPayrollData> {
  return parsePayrollWorkbook(XLSX.readFile(filePath));
}

export async function importExcelPayrollBuffer(buffer: ArrayBuffer | Buffer): Promise<ExcelPayrollData> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return parsePayrollWorkbook(workbook);
}

export function serializeExcelPayrollData(data: ExcelPayrollData): SerializedExcelPayrollData {
  return {
    periodStart: data.periodStart.toISOString(),
    periodEnd: data.periodEnd.toISOString(),
    employees: data.employees.map((employee) => ({
      ...employee,
      dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.toISOString() : null,
    })),
  };
}

export function deserializeExcelPayrollData(data: SerializedExcelPayrollData): ExcelPayrollData {
  return {
    periodStart: new Date(data.periodStart),
    periodEnd: new Date(data.periodEnd),
    employees: data.employees.map((employee) => ({
      ...employee,
      dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining) : null,
    })),
  };
}

export function excelEmployeeToPayrollInput(employee: ExcelEmployeeRow) {
  return {
    salaryType: employee.salaryType === "AHOP" ? ("DAILY" as const) : ("MONTHLY" as const),
    dailyRate: employee.dailyRate,
    monthlyRate: employee.monthlyRate,
    workingDays: Math.floor(employee.workedDays),
    workedHours: employee.workedHours,
    baselineDays: DEFAULT_MONTHLY_AHOP_BASELINE_DAYS,
    taxable: employee.taxable.toLowerCase() === "yes",
    deMinimisPay: employee.deMinimisBiMonthly,
    expectedWorkHours: employee.expectedWorkHours,
    expectedWorkHoursPay: employee.expectedWorkHoursPay,
    scheduledWorkDays: employee.scheduledWorkDays,
    scheduledWorkDaysPay: employee.scheduledWorkDaysPay,
    overtimeRegularHours: employee.rdOtHours,
    overtimeExtendedHours: employee.extendedOtHours,
    silDays: employee.silDays,
    slHours: employee.slHours,
    absenceHours: employee.absenceHours,
    absenceDeduction: employee.absenceDeduction,
    tardinessMinutes: employee.tardinessMinutes,
    tardinessDeduction: Math.abs(employee.tardinessDeduction),
    aotMinutes: employee.aotMinutes,
    aotPay: employee.aotPay,
    extraOtPremium: employee.extraOtPremium,
    regularHolidayHours: employee.regularHolidayHours,
    regularHolidayPay: employee.regularHolidayPay,
    specialHolidayHours: employee.specialHolidayHours,
    specialHolidayPay: employee.specialHolidayPay,
    totalHolidayPay: employee.totalHolidayPay,
    coAhop: employee.coAhop,
    totalAhop: employee.totalAhop,
    withholdingTax: employee.withholdingTax,
    loanDeductions: Math.abs(employee.loans),
    salaryAdjustments: employee.salaryAdjustments,
  };
}
