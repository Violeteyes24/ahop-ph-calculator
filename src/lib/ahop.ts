export type SalaryType = "DAILY" | "MONTHLY";

export interface PayrollInputs {
  salaryType: SalaryType;
  dailyRate: number;
  monthlyRate: number;
  workingDays: number;
  baselineDays: number;
  probationaryDeductionPct: number;
  overtimeRegularHours?: number;
  overtimeExtendedHours?: number;
  silDays?: number;
  slHours?: number;
  absenceHours?: number;
  tardinessDeduction?: number;
  loanDeductions?: number;
  salaryAdjustments?: number;
  previousYtdAhop?: number;
  contributionRates?: ContributionRateInputs;
}

export interface ContributionRateInputs {
  philHealthRatePct?: number;
  pagIbigEmployeeFixed?: number;
  pagIbigEmployerFixed?: number;
}

export interface PayrollResult {
  regularPay: number;
  ahopTopup: number;
  grossWithAhop: number;
  overtimeRegularPay: number;
  overtimeExtendedPay: number;
  silPay: number;
  slPay: number;
  absencePay: number;
  sssEmployee: number;
  sssEmployer: number;
  philHealthEmployee: number;
  philHealthEmployer: number;
  pagIbigEmployee: number;
  pagIbigEmployer: number;
  probationaryDeduction: number;
  tardinessDeduction: number;
  loanDeductions: number;
  salaryAdjustments: number;
  netPay: number;
  ytdAhop: number;
  annualRegularProjection: number;
  annualWithAhopProjection: number;
}

interface SssBracket {
  maxGross: number;
  employee: number;
  employer: number;
}

const SSS_BRACKETS: SssBracket[] = [
  { maxGross: 11500, employee: 575, employer: 1160 },
  { maxGross: 12650, employee: 625, employer: 1260 },
  { maxGross: 13800, employee: 700, employer: 1410 },
];

const SSS_EMPLOYEE_RATE_FALLBACK = 700 / 13800;
const SSS_EMPLOYER_RATE_FALLBACK = 1410 / 13800;
const PHILHEALTH_RATE = 0.025;
const PAGIBIG_FIXED = 200;
const V1_ANNUAL_BASELINE_DAYS = 259;

export const HANDBOOK_REFERENCE = {
  monthlyExample: {
    dailyRate: 500,
    workingDays: 22,
    regularDaily: 11000,
    withAhop: 11500,
  },
  annualExample: {
    workingDays: 259,
    regularDaily: 136400,
    withAhop: 138000,
  },
  deductionExamples: [
    {
      gross: 11500,
      sssEmployer: 1160,
      sssEmployee: 575,
      pagIbigEmployer: 200,
      pagIbigEmployee: 200,
      philHealthEmployer: 287.5,
      philHealthEmployee: 287.5,
    },
    {
      gross: 12650,
      sssEmployer: 1260,
      sssEmployee: 625,
      pagIbigEmployer: 200,
      pagIbigEmployee: 200,
      philHealthEmployer: 316.25,
      philHealthEmployee: 316.25,
    },
    {
      gross: 13800,
      sssEmployer: 1410,
      sssEmployee: 700,
      pagIbigEmployer: 200,
      pagIbigEmployee: 200,
      philHealthEmployer: 345,
      philHealthEmployee: 345,
    },
  ],
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function getSss(gross: number): { employee: number; employer: number } {
  const matched = SSS_BRACKETS.find((entry) => gross <= entry.maxGross);

  if (matched) {
    return { employee: matched.employee, employer: matched.employer };
  }

  return {
    employee: round2(gross * SSS_EMPLOYEE_RATE_FALLBACK),
    employer: round2(gross * SSS_EMPLOYER_RATE_FALLBACK),
  };
}

export function calculatePayroll(input: PayrollInputs): PayrollResult {
  const safeDailyRate = Math.max(0, input.dailyRate || 0);
  const safeMonthlyRate = Math.max(0, input.monthlyRate || 0);
  const safeWorkingDays = Math.max(0, Math.floor(input.workingDays || 0));
  const safeBaselineDays = Math.max(1, Math.floor(input.baselineDays || 23));
  const safeProbationPct = Math.max(0, input.probationaryDeductionPct || 0);

  const safeOTRegularHours = Math.max(0, input.overtimeRegularHours || 0);
  const safeOTExtendedHours = Math.max(0, input.overtimeExtendedHours || 0);
  const safeSilDays = Math.max(0, input.silDays || 0);
  const safeSlHours = Math.max(0, input.slHours || 0);
  const safeAbsenceHours = Math.max(0, input.absenceHours || 0);
  const safeTardinessDeduction = Math.max(0, input.tardinessDeduction || 0);
  const safeLoanDeductions = Math.max(0, input.loanDeductions || 0);
  const safeSalaryAdjustments = input.salaryAdjustments || 0;
  const safePreviousYtdAhop = Math.max(0, input.previousYtdAhop || 0);
  const philHealthRate =
    Math.max(0, input.contributionRates?.philHealthRatePct ?? PHILHEALTH_RATE * 100) / 100;
  const pagIbigEmployeeFixed = Math.max(
    0,
    input.contributionRates?.pagIbigEmployeeFixed ?? PAGIBIG_FIXED
  );
  const pagIbigEmployerFixed = Math.max(
    0,
    input.contributionRates?.pagIbigEmployerFixed ?? PAGIBIG_FIXED
  );

  const inferredMonthlyRateFromDaily = round2(safeDailyRate * safeBaselineDays);
  const effectiveMonthlyRate = safeMonthlyRate > 0 ? safeMonthlyRate : inferredMonthlyRateFromDaily;

  const regularPay =
    input.salaryType === "DAILY"
      ? round2(safeDailyRate * safeWorkingDays)
      : round2(effectiveMonthlyRate);

  // AHOP calculation (only for DAILY salary type)
  const ahopDays = input.salaryType === "DAILY" ? Math.max(0, safeBaselineDays - safeWorkingDays) : 0;
  const ahopTopup = input.salaryType === "DAILY" ? round2(ahopDays * safeDailyRate) : 0;

  // Overtime calculations (1x and 1.3x rates)
  const hourlyRate = round2(safeDailyRate / 8);
  const overtimeRegularPay = round2(safeOTRegularHours * hourlyRate);
  const overtimeExtendedPay = round2(safeOTExtendedHours * hourlyRate * 1.3);

  // Leave calculations
  const silPay = round2(safeSilDays * safeDailyRate);
  const slPay = round2(safeSlHours * hourlyRate);
  const absencePay = round2(safeAbsenceHours * hourlyRate);

  // Total gross (base + OT + leaves)
  const grossWithAhop = round2(
    regularPay + ahopTopup + overtimeRegularPay + overtimeExtendedPay + silPay + slPay - absencePay
  );

  // YTD AHOP tracking
  const ytdAhop = round2(safePreviousYtdAhop + ahopTopup);

  const sss = getSss(grossWithAhop);
  const philHealthEmployee = round2(grossWithAhop * philHealthRate);
  const philHealthEmployer = round2(grossWithAhop * philHealthRate);

  const probationaryDeduction = round2(grossWithAhop * (safeProbationPct / 100));

  const employeeTotalDeductions =
    sss.employee +
    philHealthEmployee +
    pagIbigEmployeeFixed +
    probationaryDeduction +
    safeTardinessDeduction +
    safeLoanDeductions;

  const netPay = round2(grossWithAhop + safeSalaryAdjustments - employeeTotalDeductions);

  const annualRegularProjection =
    input.salaryType === "DAILY"
      ? round2(safeDailyRate * V1_ANNUAL_BASELINE_DAYS)
      : round2(effectiveMonthlyRate * 12);

  const annualWithAhopProjection =
    input.salaryType === "DAILY"
      ? round2(safeDailyRate * safeBaselineDays * 12)
      : round2(effectiveMonthlyRate * 12);

  return {
    regularPay,
    ahopTopup,
    grossWithAhop,
    overtimeRegularPay,
    overtimeExtendedPay,
    silPay,
    slPay,
    absencePay,
    sssEmployee: sss.employee,
    sssEmployer: sss.employer,
    philHealthEmployee,
    philHealthEmployer,
    pagIbigEmployee: pagIbigEmployeeFixed,
    pagIbigEmployer: pagIbigEmployerFixed,
    probationaryDeduction,
    tardinessDeduction: safeTardinessDeduction,
    loanDeductions: safeLoanDeductions,
    salaryAdjustments: safeSalaryAdjustments,
    netPay,
    ytdAhop,
    annualRegularProjection,
    annualWithAhopProjection,
  };
}
