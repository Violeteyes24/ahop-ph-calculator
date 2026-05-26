import { PayrollResult } from "./ahop";
import { ExcelEmployeeRow } from "./excel-importer";

export interface PayrollSummaryRow {
  disbursementMethod: string;
  employeeName: string;
  position: string;
  dateOfJoining: string;
  basicPay: number;
  leaves: number;
  overtimeRegular: number;
  overtimeExtended: number;
  anotherOT: number;
  accumulatedHoliday: number;
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

    const disbursement = employee.disbursementType === "Cash" ? "CASH" : "ONLINE";
    const totalDeductionsForEmployee =
      payroll.sssEmployee +
      payroll.philHealthEmployee +
      payroll.pagIbigEmployee +
      payroll.probationaryDeduction +
      payroll.tardinessDeduction +
      payroll.loanDeductions;

    const row: PayrollSummaryRow = {
      disbursementMethod: disbursement,
      employeeName: employee.name,
      position: employee.position,
      dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.toISOString().split("T")[0] : "N/A",
      basicPay: payroll.regularPay,
      leaves: payroll.silPay + payroll.slPay,
      overtimeRegular: payroll.overtimeRegularPay,
      overtimeExtended: payroll.overtimeExtendedPay,
      anotherOT: 0, // Placeholder for additional OT types
      accumulatedHoliday: payroll.ahopTopup,
      otPercentage: payroll.overtimeRegularPay > 0 ? 100 : 0, // Percentage indicator
      coAhop: 0, // Company contribution AHOP (if applicable)
      deminimis: employee.deminimis,
      tardinessUndertime: payroll.tardinessDeduction,
      absence: -payroll.absencePay, // Shown as deduction
      salaryAdjustments: payroll.salaryAdjustments,
      grossIncome: payroll.grossWithAhop,
      sss: payroll.sssEmployee,
      philhealth: payroll.philHealthEmployee,
      pagibig: payroll.pagIbigEmployee,
      withholdingTax: 0, // Not yet calculated
      loans: payroll.loanDeductions,
      totalDeductions: totalDeductionsForEmployee,
      netIncome: payroll.netPay,
      previousYtdAhop: employee.deminimis, // Placeholder
      ytdAhop: payroll.ytdAhop,
    };

    rows.push(row);
    totalGrossIncome += payroll.grossWithAhop;
    totalDeductions += totalDeductionsForEmployee;
    totalNetIncome += payroll.netPay;
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
    "Disbursement Method",
    "Employee Name",
    "Position",
    "Date of Joining",
    "Basic Pay",
    "Leaves",
    "Overtime (Regular)",
    "Overtime (Extended)",
    "Another OT",
    "Accumulated Holiday",
    "OT %",
    "CO AHOP",
    "De Minimis",
    "Tardiness/Undertime",
    "Absence",
    "Salary Adjustments",
    "Gross Income",
    "SSS",
    "Philhealth",
    "Pag-ibig",
    "Withholding Tax",
    "Loans",
    "Total Deductions",
    "Net Income",
    "Previous YTD AHOP",
    "YTD AHOP",
  ];

  const rows = summary.rows.map((row) => [
    row.disbursementMethod,
    row.employeeName,
    row.position,
    row.dateOfJoining,
    row.basicPay.toFixed(2),
    row.leaves.toFixed(2),
    row.overtimeRegular.toFixed(2),
    row.overtimeExtended.toFixed(2),
    row.anotherOT.toFixed(2),
    row.accumulatedHoliday.toFixed(2),
    row.otPercentage,
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
    headers.join(","),
    ...rows.map((row) => row.join(",")),
    "",
    `Period: ${startStr} to ${endStr}`,
    `Total Rows: ${summary.totalRows}`,
    `Total Gross Income: ${summary.totalGrossIncome.toFixed(2)}`,
    `Total Deductions: ${summary.totalDeductions.toFixed(2)}`,
    `Total Net Income: ${summary.totalNetIncome.toFixed(2)}`,
  ].join("\n");

  return csv;
}
