export type SalaryType = "DAILY" | "MONTHLY";

export interface PayrollInputs {
  salaryType: SalaryType;
  dailyRate: number;
  monthlyRate: number;
  workingDays: number;
  baselineDays: number;
  probationaryDeductionPct: number;
}

export interface PayrollResult {
  regularPay: number;
  ahopTopup: number;
  grossWithAhop: number;
  sssEmployee: number;
  sssEmployer: number;
  philHealthEmployee: number;
  philHealthEmployer: number;
  pagIbigEmployee: number;
  pagIbigEmployer: number;
  probationaryDeduction: number;
  netPay: number;
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

  const inferredMonthlyRateFromDaily = round2(safeDailyRate * safeBaselineDays);
  const effectiveMonthlyRate = safeMonthlyRate > 0 ? safeMonthlyRate : inferredMonthlyRateFromDaily;

  const regularPay =
    input.salaryType === "DAILY"
      ? round2(safeDailyRate * safeWorkingDays)
      : round2(effectiveMonthlyRate);

  const ahopDays = input.salaryType === "DAILY" ? Math.max(0, safeBaselineDays - safeWorkingDays) : 0;
  const ahopTopup = input.salaryType === "DAILY" ? round2(ahopDays * safeDailyRate) : 0;
  const grossWithAhop = round2(regularPay + ahopTopup);

  const sss = getSss(grossWithAhop);
  const philHealthEmployee = round2(grossWithAhop * PHILHEALTH_RATE);
  const philHealthEmployer = round2(grossWithAhop * PHILHEALTH_RATE);

  const probationaryDeduction = round2(grossWithAhop * (safeProbationPct / 100));

  const employeeTotalDeductions =
    sss.employee + philHealthEmployee + PAGIBIG_FIXED + probationaryDeduction;

  const netPay = round2(grossWithAhop - employeeTotalDeductions);

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
    sssEmployee: sss.employee,
    sssEmployer: sss.employer,
    philHealthEmployee,
    philHealthEmployer,
    pagIbigEmployee: PAGIBIG_FIXED,
    pagIbigEmployer: PAGIBIG_FIXED,
    probationaryDeduction,
    netPay,
    annualRegularProjection,
    annualWithAhopProjection,
  };
}
