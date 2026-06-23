import { PayrollResult } from "./ahop";
import { ExcelEmployeeRow } from "./excel-importer";

export interface PayrollSummaryRow {
  cash: string;
  employeeName: string;
  position: string;
  dateOfJoining: string;
  salaryDisbursementType: string;
  basicPay: number;
  leaves: number;
  ot: number;
  aot: number;
  holidayPay: number;
  otPercentage: number;
  coAhop: number;
  deminimis: number;
  tardinessUndertime: number;
  absence: number;
  salaryAdjustments: number;
  grossIncome: number;
  sss: number;
  philhealth: number;
  pagibig: number;
  withholdingTax: number;
  loans: number;
  totalDeductions: number;
  netIncome: number;
  previousYtdAhop: number;
  ytdAhop: number;
}

export interface PayrollSummary {
  periodStart: Date;
  periodEnd: Date;
  totalRows: number;
  totalGrossIncome: number;
  totalDeductions: number;
  totalNetIncome: number;
  rows: PayrollSummaryRow[];
}

function sheetOrFallback(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value !== 0 ? value : fallback;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function generatePayrollSummary(
  employees: ExcelEmployeeRow[],
  calculatedPayrolls: Map<string, PayrollResult>,
  periodStart: Date,
  periodEnd: Date
): PayrollSummary {
  const rows: PayrollSummaryRow[] = [];
  let totalGrossIncome = 0;
  let totalDeductions = 0;
  let totalNetIncome = 0;

  for (const employee of employees) {
    const payroll = calculatedPayrolls.get(employee.name);
    if (!payroll) continue;

    const cash = employee.disbursementType === "Cash" ? "CASH" : "";
    const deMinimisBiMonthly = sheetOrFallback(employee.deMinimisBiMonthly, employee.deminimis / 2);
    const basicPay = sheetOrFallback(employee.basicPay, payroll.regularPay);
    const leaves = sheetOrFallback(employee.totalLeavesPay, payroll.silPay + payroll.slPay);
    const ot = sheetOrFallback(employee.otTotalPay, payroll.overtimeRegularPay + payroll.overtimeExtendedPay);
    const aot = sheetOrFallback(employee.aotPay, 0);
    const holidayPay = sheetOrFallback(employee.totalHolidayPay, 0);
    const otPercentage = sheetOrFallback(employee.extraOtPremium, 0);
    const coAhop = sheetOrFallback(employee.coAhop, payroll.ahopTopup);
    const tardinessUndertime = sheetOrFallback(employee.tardinessDeduction, -Math.abs(payroll.tardinessDeduction));
    const absence = sheetOrFallback(employee.absenceDeduction, -Math.abs(payroll.absencePay));
    const salaryAdjustments = sheetOrFallback(employee.salaryAdjustments, payroll.salaryAdjustments);
    const grossIncome = sheetOrFallback(employee.grossIncome, payroll.grossWithAhop);
    const sss = sheetOrFallback(employee.sss, payroll.sssEmployee);
    const philhealth = sheetOrFallback(employee.philHealth, payroll.philHealthEmployee);
    const pagibig = sheetOrFallback(employee.pagIbig, payroll.pagIbigEmployee);
    const withholdingTax = sheetOrFallback(employee.withholdingTax, 0);
    const loans = sheetOrFallback(employee.loans, payroll.loanDeductions);
    const totalDeductionsForEmployee =
      sss +
      philhealth +
      pagibig +
      withholdingTax +
      loans;
    const netIncome = grossIncome + salaryAdjustments - totalDeductionsForEmployee;

    const row: PayrollSummaryRow = {
      cash,
      employeeName: employee.name,
      position: employee.position,
      dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.toISOString().split("T")[0] : "N/A",
      salaryDisbursementType: employee.disbursementType,
      basicPay,
      leaves,
      ot,
      aot,
      holidayPay,
      otPercentage,
      coAhop,
      deminimis: deMinimisBiMonthly,
      tardinessUndertime,
      absence,
      salaryAdjustments,
      grossIncome,
      sss,
      philhealth,
      pagibig,
      withholdingTax,
      loans,
      totalDeductions: totalDeductionsForEmployee,
      netIncome,
      previousYtdAhop: payroll.ytdAhop - coAhop,
      ytdAhop: payroll.ytdAhop,
    };

    rows.push(row);
    totalGrossIncome += grossIncome;
    totalDeductions += totalDeductionsForEmployee;
    totalNetIncome += netIncome;
  }

  return {
    periodStart,
    periodEnd,
    totalRows: rows.length,
    totalGrossIncome,
    totalDeductions,
    totalNetIncome,
    rows,
  };
}

export function exportPayrollToCSV(summary: PayrollSummary): string {
  const headers = [
    "CASH",
    "Employee Name",
    "Position",
    "Date of Joining",
    "Salary Disbursement Type",
    "Basic Pay",
    "Leaves",
    "OT",
    "AOT",
    "AH",
    "OT %",
    "CO AHOP",
    "De Minimis",
    "Tardiness/Undertime",
    "Absence",
    "Salary adjustments/SIL Conversion",
    "Gross Income",
    "SSS",
    "Philhealth",
    "Pagibig",
    "W/Holding Tax",
    "Loans",
    "Total",
    "Net Income",
    "Previous Pay Period's YTD AHOP",
    "YTD AHOP",
  ];

  const rows = summary.rows.map((row) => [
    row.cash,
    row.employeeName,
    row.position,
    row.dateOfJoining,
    row.salaryDisbursementType,
    row.basicPay.toFixed(2),
    row.leaves.toFixed(2),
    row.ot.toFixed(2),
    row.aot.toFixed(2),
    row.holidayPay.toFixed(2),
    row.otPercentage.toFixed(2),
    row.coAhop.toFixed(2),
    row.deminimis.toFixed(2),
    row.tardinessUndertime.toFixed(2),
    row.absence.toFixed(2),
    row.salaryAdjustments.toFixed(2),
    row.grossIncome.toFixed(2),
    row.sss.toFixed(2),
    row.philhealth.toFixed(2),
    row.pagibig.toFixed(2),
    row.withholdingTax.toFixed(2),
    row.loans.toFixed(2),
    row.totalDeductions.toFixed(2),
    row.netIncome.toFixed(2),
    row.previousYtdAhop.toFixed(2),
    row.ytdAhop.toFixed(2),
  ]);

  const startStr = summary.periodStart && !isNaN(summary.periodStart.getTime())
    ? summary.periodStart.toISOString().split("T")[0]
    : "Unknown";
  const endStr = summary.periodEnd && !isNaN(summary.periodEnd.getTime())
    ? summary.periodEnd.toISOString().split("T")[0]
    : "Unknown";

  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
    "",
    `Period: ${startStr} to ${endStr}`,
    `Total Rows: ${summary.totalRows}`,
    `Total Gross Income: ${summary.totalGrossIncome.toFixed(2)}`,
    `Total Deductions: ${summary.totalDeductions.toFixed(2)}`,
    `Total Net Income: ${summary.totalNetIncome.toFixed(2)}`,
  ].join("\n");

  return csv;
}
