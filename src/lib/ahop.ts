export type SalaryType = "DAILY" | "MONTHLY";

export interface PayrollInputs {
  salaryType: SalaryType;
  dailyRate: number;
  monthlyRate: number;
  workingDays: number;
  workedHours?: number;
  baselineDays: number;
  taxable?: boolean;
  deMinimisPay?: number;
  expectedWorkHours?: number;
  expectedWorkHoursPay?: number;
  scheduledWorkDays?: number;
  scheduledWorkDaysPay?: number;
  overtimeRegularHours?: number;
  overtimeExtendedHours?: number;
  silDays?: number;
  slHours?: number;
  absenceHours?: number;
  absenceDeduction?: number;
  tardinessMinutes?: number;
  tardinessDeduction?: number;
  aotMinutes?: number;
  aotPay?: number;
  extraOtPremium?: number;
  regularHolidayHours?: number;
  regularHolidayPay?: number;
  specialHolidayHours?: number;
  specialHolidayPay?: number;
  totalHolidayPay?: number;
  coAhop?: number;
  totalAhop?: number;
  withholdingTax?: number;
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
  deMinimisPay: number;
  overtimeRegularPay: number;
  overtimeExtendedPay: number;
  otTotalHours: number;
  otTotalPay: number;
  silPay: number;
  slPay: number;
  totalLeaves: number;
  totalLeavesPay: number;
  absencePay: number;
  absenceDeduction: number;
  sssEmployee: number;
  sssEmployer: number;
  philHealthEmployee: number;
  philHealthEmployer: number;
  pagIbigEmployee: number;
  pagIbigEmployer: number;
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
  { maxGross: 11250, employee: 550, employer: 1110 },
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
  const safeWorkedHours = Math.max(0, input.workedHours || safeWorkingDays * 8);
  const safeBaselineDays = Math.max(1, Math.floor(input.baselineDays || 23));

  const safeDeMinimisPay = Math.max(0, input.deMinimisPay || 0);
  const safeExpectedWorkHoursPay = Math.max(0, input.expectedWorkHoursPay || 0);
  const safeScheduledWorkDays = Math.max(0, input.scheduledWorkDays || 0);
  const safeScheduledWorkDaysPay = Math.max(0, input.scheduledWorkDaysPay || 0);
  const safeOTRegularHours = Math.max(0, input.overtimeRegularHours || 0);
  const safeOTExtendedHours = Math.max(0, input.overtimeExtendedHours || 0);
  const safeSilDays = Math.max(0, input.silDays || 0);
  const safeSlHours = Math.max(0, input.slHours || 0);
  const safeAbsenceHours = Math.max(0, input.absenceHours || 0);
  const safeTardinessMinutes = Math.max(0, input.tardinessMinutes || 0);
  const safeTardinessDeduction = Math.max(0, input.tardinessDeduction || 0);
  const safeAotMinutes = Math.max(0, input.aotMinutes || 0);
  const safeRegularHolidayHours = Math.max(0, input.regularHolidayHours || 0);
  const safeSpecialHolidayHours = Math.max(0, input.specialHolidayHours || 0);
  const safeWithholdingTax = Math.max(0, input.withholdingTax || 0);
  const safeLoanDeductions = Math.max(0, input.loanDeductions || 0);
  const safeSalaryAdjustments = input.salaryAdjustments || 0;
  const safePreviousYtdAhop = Math.max(0, input.previousYtdAhop || 0);
  const isTemplateMode =
    (input.expectedWorkHoursPay ?? 0) > 0 ||
    (input.expectedWorkHours ?? 0) > 0 ||
    (input.scheduledWorkDaysPay ?? 0) > 0 ||
    (input.scheduledWorkDays ?? 0) > 0 ||
    (input.workedHours ?? 0) > 0 ||
    safeAotMinutes > 0 ||
    (input.aotPay ?? 0) > 0 ||
    (input.extraOtPremium ?? 0) !== 0 ||
    safeRegularHolidayHours > 0 ||
    (input.regularHolidayPay ?? 0) > 0 ||
    safeSpecialHolidayHours > 0 ||
    (input.specialHolidayPay ?? 0) > 0 ||
    (input.coAhop ?? 0) !== 0 ||
    (input.totalAhop ?? 0) !== 0 ||
    safeWithholdingTax > 0 ||
    safeLoanDeductions > 0;
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
  const halfMonthlyRate = round2(effectiveMonthlyRate / 2);
  const isTaxableAhopTemplate = isTemplateMode && input.salaryType === "DAILY" && (input.taxable ?? false);
  const semiMonthlyTargetPay = round2((safeDailyRate * safeBaselineDays) / 2);
  const scheduledGrossPay =
    safeScheduledWorkDays > 0
      ? round2(safeScheduledWorkDays * safeDailyRate)
      : safeScheduledWorkDaysPay > 0
      ? safeScheduledWorkDaysPay
      : isTaxableAhopTemplate
      ? 0
      : safeExpectedWorkHoursPay;

  const regularPay = isTemplateMode
    ? isTaxableAhopTemplate
      ? round2(Math.max(0, scheduledGrossPay - safeDeMinimisPay))
      : input.taxable
      ? round2(halfMonthlyRate - safeDeMinimisPay)
      : round2((safeWorkedHours / 8) * safeDailyRate)
    : input.salaryType === "DAILY"
    ? round2(safeDailyRate * safeWorkingDays)
    : round2(effectiveMonthlyRate);

  // AHOP calculation (only for DAILY salary type)
  const ahopDays = input.salaryType === "DAILY" ? Math.max(0, safeBaselineDays - safeWorkingDays) : 0;
  const expectedAhop =
    isTaxableAhopTemplate
      ? round2(semiMonthlyTargetPay - scheduledGrossPay)
      : isTemplateMode && input.salaryType === "DAILY"
      ? round2(Math.max(0, halfMonthlyRate - safeExpectedWorkHoursPay))
      : 0;

  // Overtime calculations (1x and 1.3x rates)
  const hourlyRate = round2(safeDailyRate / 8);
  const overtimeRegularPay = round2(safeOTRegularHours * hourlyRate);
  const overtimeExtendedPay = round2(safeOTExtendedHours * hourlyRate * (isTemplateMode ? 1 : 1.3));
  const otTotalHours = round2(safeOTRegularHours + safeOTExtendedHours);
  const otTotalPay = round2(overtimeRegularPay + overtimeExtendedPay);

  // Leave calculations
  const silPay = round2(safeSilDays * safeDailyRate);
  const slPay = round2(safeSlHours * hourlyRate);
  const totalLeaves = round2(safeSilDays + safeSlHours / 8);
  const totalLeavesPay = round2(silPay + slPay);
  const absencePay = round2(safeAbsenceHours * hourlyRate);
  const templateAbsenceDeductionAmount = round2(
    input.absenceDeduction !== undefined
      ? Math.abs(input.absenceDeduction)
      : safeAbsenceHours > 0
      ? (safeAbsenceHours / 8) * safeDailyRate
      : absencePay
  );
  const absenceDeduction = round2(input.absenceDeduction ?? -templateAbsenceDeductionAmount);
  const tardinessDeductionForNet = round2(
    input.tardinessDeduction !== undefined
      ? Math.abs(input.tardinessDeduction)
      : safeTardinessMinutes > 0
      ? safeTardinessMinutes * (hourlyRate / 60)
      : safeTardinessDeduction
  );

  const aotPay = round2(input.aotPay ?? safeAotMinutes * (hourlyRate / 60));
  const extraOtPremium = round2(
    input.extraOtPremium ?? safeOTRegularHours * hourlyRate * 0.3 + safeOTExtendedHours * hourlyRate * 0.25
  );
  const regularHolidayPay = round2(input.regularHolidayPay ?? safeRegularHolidayHours * hourlyRate);
  const specialHolidayPay = round2(input.specialHolidayPay ?? safeSpecialHolidayHours * hourlyRate * 0.3);
  const totalHolidayPay = round2(input.totalHolidayPay ?? regularHolidayPay + specialHolidayPay);
  const coAhop = round2(
    input.coAhop ??
      (isTaxableAhopTemplate
        ? expectedAhop - aotPay - extraOtPremium - regularHolidayPay - specialHolidayPay
        : input.salaryType === "DAILY"
        ? Math.max(0, halfMonthlyRate - safeExpectedWorkHoursPay - aotPay - extraOtPremium - totalHolidayPay)
        : 0)
  );
  const totalAhop = round2(input.totalAhop ?? aotPay + extraOtPremium + regularHolidayPay + specialHolidayPay + coAhop);
  const ahopTopup = isTemplateMode
    ? totalAhop
    : input.salaryType === "DAILY"
    ? round2(ahopDays * safeDailyRate)
    : 0;

  // Total gross (base + OT + leaves)
  const grossWithAhop = isTemplateMode
    ? isTaxableAhopTemplate
      ? round2(
          regularPay +
            safeDeMinimisPay -
            templateAbsenceDeductionAmount -
            tardinessDeductionForNet +
            totalAhop +
            otTotalPay +
            totalLeavesPay
        )
      : round2(safeDeMinimisPay + regularPay + expectedAhop + otTotalPay + totalLeavesPay - tardinessDeductionForNet)
    : round2(
        regularPay + ahopTopup + overtimeRegularPay + overtimeExtendedPay + silPay + slPay - absencePay
      );

  // YTD AHOP tracking
  const ytdAhop = round2(safePreviousYtdAhop + (isTemplateMode ? totalAhop : ahopTopup));

  const contributionBase = isTaxableAhopTemplate ? semiMonthlyTargetPay : grossWithAhop;
  const sss = getSss(contributionBase);
  const philHealthEmployee = isTaxableAhopTemplate
    ? contributionBase * philHealthRate
    : round2(contributionBase * philHealthRate);
  const philHealthEmployer = isTaxableAhopTemplate
    ? contributionBase * philHealthRate
    : round2(contributionBase * philHealthRate);

  const employeeTotalDeductions =
    sss.employee +
    philHealthEmployee +
    pagIbigEmployeeFixed +
    (isTemplateMode ? safeWithholdingTax : safeTardinessDeduction) +
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
    deMinimisPay: safeDeMinimisPay,
    overtimeRegularPay,
    overtimeExtendedPay,
    otTotalHours,
    otTotalPay,
    silPay,
    slPay,
    totalLeaves,
    totalLeavesPay,
    absencePay,
    absenceDeduction,
    sssEmployee: sss.employee,
    sssEmployer: sss.employer,
    philHealthEmployee,
    philHealthEmployer,
    pagIbigEmployee: pagIbigEmployeeFixed,
    pagIbigEmployer: pagIbigEmployerFixed,
    tardinessMinutes: safeTardinessMinutes,
    tardinessDeduction: tardinessDeductionForNet,
    aotMinutes: safeAotMinutes,
    aotPay,
    extraOtPremium,
    regularHolidayHours: safeRegularHolidayHours,
    regularHolidayPay,
    specialHolidayHours: safeSpecialHolidayHours,
    specialHolidayPay,
    totalHolidayPay,
    coAhop,
    totalAhop,
    withholdingTax: safeWithholdingTax,
    loanDeductions: safeLoanDeductions,
    salaryAdjustments: safeSalaryAdjustments,
    netPay,
    ytdAhop,
    annualRegularProjection,
    annualWithAhopProjection,
  };
}
