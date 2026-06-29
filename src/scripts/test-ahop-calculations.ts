import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calculatePayroll } from "@/lib/ahop";

function assertEqual(actual: number, expected: number, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function assertIncludesInOrder(text: string, first: string, second: string, label: string): void {
  const firstIndex = text.indexOf(first);
  const secondIndex = text.indexOf(second);

  if (firstIndex === -1 || secondIndex === -1 || firstIndex >= secondIndex) {
    throw new Error(`${label}: expected "${first}" before "${second}"`);
  }
}

const dailyResult = calculatePayroll({
  salaryType: "DAILY",
  dailyRate: 500,
  monthlyRate: 11_000,
  workingDays: 22,
  baselineDays: 23,
});

assertEqual(dailyResult.grossWithAhop, 11_500, "daily gross with AHOP");
assertEqual(dailyResult.sssEmployee, 575, "daily SSS employee share");
assertEqual(dailyResult.philHealthEmployee, 287.5, "daily PhilHealth employee share");
assertEqual(dailyResult.pagIbigEmployee, 200, "daily Pag-IBIG employee share");
assertEqual(dailyResult.netPay, 10_437.5, "daily net excludes removed employee deduction");

const templateResult = calculatePayroll({
  salaryType: "DAILY",
  dailyRate: 500,
  monthlyRate: 23_000,
  workingDays: 22,
  workedHours: 176,
  baselineDays: 23,
  taxable: false,
  deMinimisPay: 0,
  expectedWorkHoursPay: 11_000,
  withholdingTax: 100,
  loanDeductions: 200,
  tardinessDeduction: 50,
});

assertEqual(templateResult.grossWithAhop, 11_450, "template gross subtracts tardiness");
assertEqual(templateResult.withholdingTax, 100, "template withholding is retained");
assertEqual(templateResult.loanDeductions, 200, "template loans are retained");
assertEqual(templateResult.netPay, 10_088.75, "template net includes withholding and loans");

const zacharyPayslipResult = calculatePayroll({
  salaryType: "DAILY",
  dailyRate: 950,
  monthlyRate: 20_900,
  workingDays: 11,
  workedHours: 88,
  baselineDays: 23,
  taxable: true,
  deMinimisPay: 1_691.5,
  expectedWorkHoursPay: 10_925,
  scheduledWorkDays: 11,
  scheduledWorkDaysPay: 10_450,
  absenceHours: 16,
  absenceDeduction: -1_900,
  tardinessMinutes: 5,
  tardinessDeduction: 9.8958333333,
  regularHolidayHours: 8,
  regularHolidayPay: 950,
  specialHolidayHours: 0,
  specialHolidayPay: 0,
  aotMinutes: 0,
  aotPay: 0,
  extraOtPremium: 0,
  withholdingTax: 0,
  loanDeductions: 0,
  salaryAdjustments: 0,
  previousYtdAhop: 0,
  contributionRates: {
    philHealthRatePct: 2.5,
    pagIbigEmployeeFixed: 100,
    pagIbigEmployerFixed: 100,
  },
});

assertEqual(zacharyPayslipResult.regularPay, 8_758.5, "Zachary scheduled taxable basic");
assertEqual(zacharyPayslipResult.deMinimisPay, 1_691.5, "Zachary de minimis");
assertEqual(zacharyPayslipResult.absenceDeduction, -1_900, "Zachary absence deduction");
assertEqual(zacharyPayslipResult.tardinessDeduction, 9.9, "Zachary tardiness deduction display value");
assertEqual(zacharyPayslipResult.regularHolidayPay, 950, "Zachary holiday pay");
assertEqual(zacharyPayslipResult.coAhop, -475, "Zachary AHOP extra balance");
assertEqual(zacharyPayslipResult.totalAhop, 475, "Zachary total AHOP");
assertEqual(zacharyPayslipResult.ahopTopup, 475, "Zachary AHOP topup");
assertEqual(zacharyPayslipResult.grossWithAhop, 9_015.1, "Zachary gross earnings");
assertEqual(zacharyPayslipResult.sssEmployee, 550, "Zachary SSS");
assertEqual(zacharyPayslipResult.philHealthEmployee, 273.125, "Zachary raw PhilHealth");
assertEqual(Math.round(zacharyPayslipResult.philHealthEmployee * 100) / 100, 273.13, "Zachary displayed PhilHealth");
assertEqual(zacharyPayslipResult.pagIbigEmployee, 100, "Zachary Pag-IBIG");
assertEqual(
  Math.round(
    (zacharyPayslipResult.sssEmployee +
      zacharyPayslipResult.philHealthEmployee +
      zacharyPayslipResult.pagIbigEmployee) *
      100
  ) / 100,
  923.13,
  "Zachary displayed total deductions"
);
assertEqual(zacharyPayslipResult.netPay, 8_091.98, "Zachary net pay");
assertEqual(zacharyPayslipResult.ytdAhop, 475, "Zachary YTD AHOP");

const migrationSql = readFileSync(
  join(process.cwd(), "prisma", "migrations", "20260626000100_remove_probationary_deductions", "migration.sql"),
  "utf8"
);

assertIncludesInOrder(
  migrationSql,
  'SET "netPay" = "netPay" + COALESCE("probationaryDeduction", 0);',
  'DROP COLUMN "probationaryDeduction";',
  "migration preserves historical net pay before dropping probationary snapshot column"
);

console.log("Payroll calculation checks passed.");
