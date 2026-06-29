import type { SalaryType } from "@/lib/ahop";

export const DEFAULT_MONTHLY_AHOP_BASELINE_DAYS = 23;
const HOURS_PER_DAY = 8;

export interface DailyAhopDraftSource {
  salaryType: SalaryType;
  salaryCategory?: string | null;
  dailyRate: number;
  workingDays: number;
  workedHours: number;
  expectedWorkHours: number;
  expectedWorkHoursPay: number;
  scheduledWorkDays: number;
  scheduledWorkDaysPay: number;
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
}

export type DerivedDailyAhopDraftValues = Pick<
  DailyAhopDraftSource,
  | "workingDays"
  | "expectedWorkHours"
  | "expectedWorkHoursPay"
  | "scheduledWorkDaysPay"
  | "absenceDeduction"
  | "tardinessDeduction"
  | "aotPay"
  | "regularHolidayPay"
  | "specialHolidayPay"
  | "totalHolidayPay"
  | "coAhop"
  | "totalAhop"
>;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function amount(value: number | null | undefined): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function isDailyAhop(input: Pick<DailyAhopDraftSource, "salaryType" | "salaryCategory">): boolean {
  return input.salaryType === "DAILY" && (input.salaryCategory ?? "").toUpperCase() === "AHOP";
}

function hasPayBasis(input: DailyAhopDraftSource): boolean {
  return (
    amount(input.workedHours) > 0 ||
    amount(input.expectedWorkHours) > 0 ||
    amount(input.expectedWorkHoursPay) > 0 ||
    amount(input.scheduledWorkDays) > 0 ||
    amount(input.scheduledWorkDaysPay) > 0 ||
    amount(input.absenceHours) > 0 ||
    amount(input.tardinessMinutes) > 0 ||
    amount(input.aotMinutes) > 0 ||
    amount(input.aotPay) > 0 ||
    amount(input.extraOtPremium) !== 0 ||
    amount(input.regularHolidayHours) > 0 ||
    amount(input.regularHolidayPay) > 0 ||
    amount(input.specialHolidayHours) > 0 ||
    amount(input.specialHolidayPay) > 0 ||
    amount(input.coAhop) !== 0 ||
    amount(input.totalAhop) !== 0
  );
}

export function deriveDailyAhopDraftValues(
  input: DailyAhopDraftSource,
  monthlyBaselineDays = DEFAULT_MONTHLY_AHOP_BASELINE_DAYS
): DerivedDailyAhopDraftValues {
  if (!isDailyAhop(input)) {
    return {
      workingDays: input.workingDays,
      expectedWorkHours: input.expectedWorkHours,
      expectedWorkHoursPay: input.expectedWorkHoursPay,
      scheduledWorkDaysPay: input.scheduledWorkDaysPay,
      absenceDeduction: input.absenceDeduction,
      tardinessDeduction: input.tardinessDeduction,
      aotPay: input.aotPay,
      regularHolidayPay: input.regularHolidayPay,
      specialHolidayPay: input.specialHolidayPay,
      totalHolidayPay: input.totalHolidayPay,
      coAhop: input.coAhop,
      totalAhop: input.totalAhop,
    };
  }

  if (!hasPayBasis(input)) {
    return {
      workingDays: 0,
      expectedWorkHours: 0,
      expectedWorkHoursPay: 0,
      scheduledWorkDaysPay: 0,
      absenceDeduction: 0,
      tardinessDeduction: 0,
      aotPay: 0,
      regularHolidayPay: 0,
      specialHolidayPay: 0,
      totalHolidayPay: 0,
      coAhop: 0,
      totalAhop: 0,
    };
  }

  const dailyRate = Math.max(0, amount(input.dailyRate));
  const hourlyRate = dailyRate / HOURS_PER_DAY;
  const targetDays = Math.max(0, amount(monthlyBaselineDays)) / 2;
  const targetPay = round2(dailyRate * targetDays);
  const scheduledDays = Math.max(0, amount(input.scheduledWorkDays));
  const scheduledPay =
    scheduledDays > 0 ? round2(scheduledDays * dailyRate) : Math.max(0, amount(input.scheduledWorkDaysPay));
  const aotPay = amount(input.aotPay) !== 0 ? amount(input.aotPay) : round2(amount(input.aotMinutes) * (hourlyRate / 60));
  const regularHolidayPay =
    amount(input.regularHolidayHours) > 0
      ? round2((amount(input.regularHolidayHours) / HOURS_PER_DAY) * dailyRate)
      : amount(input.regularHolidayPay);
  const specialHolidayPay =
    amount(input.specialHolidayHours) > 0
      ? round2((amount(input.specialHolidayHours) / HOURS_PER_DAY) * dailyRate * 0.3)
      : amount(input.specialHolidayPay);
  const extraOtPremium = amount(input.extraOtPremium);
  const totalHolidayPay = round2(regularHolidayPay + specialHolidayPay);
  const coAhop = round2(targetPay - scheduledPay - regularHolidayPay - specialHolidayPay - aotPay - extraOtPremium);

  return {
    workingDays: scheduledDays > 0 ? Math.floor(scheduledDays) : input.workingDays,
    expectedWorkHours: round2(targetDays * HOURS_PER_DAY),
    expectedWorkHoursPay: targetPay,
    scheduledWorkDaysPay: scheduledPay,
    absenceDeduction:
      amount(input.absenceHours) > 0
        ? -round2((amount(input.absenceHours) / HOURS_PER_DAY) * dailyRate)
        : input.absenceDeduction,
    tardinessDeduction:
      amount(input.tardinessMinutes) > 0
        ? round2(amount(input.tardinessMinutes) * (hourlyRate / 60))
        : input.tardinessDeduction,
    aotPay,
    regularHolidayPay,
    specialHolidayPay,
    totalHolidayPay,
    coAhop,
    totalAhop: round2(regularHolidayPay + specialHolidayPay + aotPay + extraOtPremium + coAhop),
  };
}

export function withDerivedDailyAhopDraftValues<T extends DailyAhopDraftSource>(
  input: T,
  monthlyBaselineDays = DEFAULT_MONTHLY_AHOP_BASELINE_DAYS
): T {
  return {
    ...input,
    ...deriveDailyAhopDraftValues(input, monthlyBaselineDays),
  };
}
