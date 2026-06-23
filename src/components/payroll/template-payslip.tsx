import type { ReactNode } from "react";

type MoneyLike = { toString(): string } | number | string | null | undefined;

export interface TemplatePayslipEmployee {
  fullName: string;
  position: string | null;
  dateStarted: Date | string;
  salaryType: string;
  paymentMethod: string;
  employmentStage?: string;
  deminimisAmount: MoneyLike;
}

export interface TemplatePayslipSnapshot {
  periodStart: Date | string;
  periodEnd: Date | string;
  workingDays: number;
  baselineDays?: number;
  regularPay: MoneyLike;
  ahopTopup: MoneyLike;
  grossWithAhop: MoneyLike;
  sssEmployee: MoneyLike;
  sssEmployer?: MoneyLike;
  philHealthEmployee: MoneyLike;
  philHealthEmployer?: MoneyLike;
  pagIbigEmployee: MoneyLike;
  pagIbigEmployer?: MoneyLike;
  probationaryDeduction?: MoneyLike;
  netPay: MoneyLike;
  overtimeRegularHours: MoneyLike;
  overtimeExtendedHours: MoneyLike;
  overtimeRegularPay: MoneyLike;
  overtimeExtendedPay: MoneyLike;
  silDays: MoneyLike;
  silPay: MoneyLike;
  slHours: MoneyLike;
  slPay: MoneyLike;
  absenceHours: MoneyLike;
  absencePay: MoneyLike;
  tardinessDeduction: MoneyLike;
  loanDeductions: MoneyLike;
  salaryAdjustments: MoneyLike;
  ytdAhop: MoneyLike;
  previousYtdAhop: MoneyLike;
}

export function TemplatePayslip({
  employee,
  snapshot,
  periodLabel,
  showEmployerContributions = false,
}: {
  employee: TemplatePayslipEmployee;
  snapshot: TemplatePayslipSnapshot;
  periodLabel: string;
  showEmployerContributions?: boolean;
}) {
  const derived = getPayslipDerivedValues(employee, snapshot);
  const kind = derived.deMinimisBiMonthly > 0 ? "Template Payslip T" : "Template Payslip NT";

  return (
    <div className="payslip-print-area max-w-5xl">
      <div className="mb-3 text-xs font-medium text-[#6b7280] print:hidden">
        {kind}
      </div>
      <div className="grid gap-4 xl:grid-cols-2 print:grid-cols-2">
        <PayslipCopy
          copyLabel="Employee Copy"
          employee={employee}
          snapshot={snapshot}
          periodLabel={periodLabel}
          derived={derived}
        />
        <PayslipCopy
          copyLabel="Payroll Copy"
          employee={employee}
          snapshot={snapshot}
          periodLabel={periodLabel}
          derived={derived}
        />
      </div>
      {showEmployerContributions ? (
        <div className="mt-4 rounded-lg border border-[#ddd6ca] bg-white px-3 py-3 text-sm print:hidden">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#5c665f]">
            Employer contributions
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <MiniTotal label="SSS ER" value={toPeso(snapshot.sssEmployer)} />
            <MiniTotal label="PhilHealth ER" value={toPeso(snapshot.philHealthEmployer)} />
            <MiniTotal label="Pag-IBIG ER" value={toPeso(snapshot.pagIbigEmployer)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PayslipCopy({
  copyLabel,
  employee,
  snapshot,
  periodLabel,
  derived,
}: {
  copyLabel: string;
  employee: TemplatePayslipEmployee;
  snapshot: TemplatePayslipSnapshot;
  periodLabel: string;
  derived: ReturnType<typeof getPayslipDerivedValues>;
}) {
  const salaryAdjustments = amount(snapshot.salaryAdjustments);
  const probationaryDeduction = amount(snapshot.probationaryDeduction);

  return (
    <section className="payslip-sheet bg-white p-4 text-[11px] leading-tight text-[#1f2937]">
      <header className="border-b border-[#9ca3af] pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wide text-[#111827]">
              Apnea Dynamics Inc.
            </h1>
            <p className="mt-0.5 text-[10px] uppercase text-[#4b5563]">Employee payslip</p>
          </div>
          <div className="text-right text-[10px] text-[#4b5563]">
            <p className="font-semibold text-[#111827]">{copyLabel}</p>
            <p>{periodLabel}</p>
          </div>
        </div>
      </header>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
        <Info label="Employee Name" value={employee.fullName} />
        <Info label="Designation" value={employee.position || "-"} />
        <Info label="Date of Joining" value={toDateLabel(employee.dateStarted)} />
        <Info label="Payroll Period" value={`${toDateLabel(snapshot.periodStart)} to ${toDateLabel(snapshot.periodEnd)}`} />
        <Info label="Salary Type" value={employee.salaryType} />
        <Info label="Salary Disbursement" value={employee.paymentMethod === "CASH" ? "Cash" : "Online"} />
      </dl>

      <div className="mt-3 grid gap-3">
        <TableBlock title="Earnings">
          <Line label="Basic Pay" quantity={`${snapshot.workingDays} days`} value={toPeso(snapshot.regularPay)} />
          <Line label="Leaves" quantity={formatQty(derived.leaveDays)} value={toPeso(derived.leavesPay)} />
          <Line label="Absence" quantity={formatQty(derived.absenceDays)} value={toPeso(derived.absenceAmount)} />
          {derived.deMinimisBiMonthly > 0 ? (
            <Line label="De Minimis (Rice, uniform, transport, etc)" quantity="" value={toPeso(derived.deMinimisBiMonthly)} />
          ) : null}
          <Line label="Tardiness/Undertime" quantity="" value={toPeso(derived.tardinessAmount)} />
          <Line label="Extra OT" quantity={`${formatQty(derived.otHours)} hrs`} value={toPeso(derived.otPay)} />
          {salaryAdjustments !== 0 ? (
            <Line label="Salary adjustments/SIL Conversion" quantity="" value={toPeso(salaryAdjustments)} />
          ) : null}
          <Line label="Total" quantity="" value={toPeso(derived.grossIncome)} strong />
        </TableBlock>

        <TableBlock title="AHOP">
          <Line label="Overtime %" quantity="" value={toPeso(0)} />
          <Line label="Overtime" quantity="" value={toPeso(0)} />
          <Line label="Holiday" quantity="" value={toPeso(0)} />
          <Line label="Extra" quantity="" value={toPeso(snapshot.ahopTopup)} />
          <Line label="YTD AHOP" quantity="" value={toPeso(snapshot.ytdAhop)} strong />
        </TableBlock>

        <TableBlock title="Deductions">
          <Line label="SSS" quantity="" value={toPeso(snapshot.sssEmployee)} />
          <Line label="PhilHealth" quantity="" value={toPeso(snapshot.philHealthEmployee)} />
          <Line label="Pagibig" quantity="" value={toPeso(snapshot.pagIbigEmployee)} />
          <Line label="W/Holding Tax" quantity="" value={toPeso(0)} />
          <Line label="Loans" quantity="" value={toPeso(snapshot.loanDeductions)} />
          {probationaryDeduction > 0 ? (
            <Line label="Probationary deduction" quantity="" value={toPeso(probationaryDeduction)} />
          ) : null}
          <Line label="Total Deductions" quantity="" value={toPeso(derived.totalDeductions)} strong />
        </TableBlock>
      </div>

      <div className="mt-3 border-y border-[#9ca3af] py-2">
        <div className="flex items-center justify-between text-sm font-bold uppercase text-[#111827]">
          <span>Net Pay</span>
          <span>{toPeso(derived.netPay)}</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center text-[10px] text-[#4b5563]">
        <Signature label="Prepared by" />
        <Signature label="Reviewed by" />
        <Signature label="Employee" />
      </div>
    </section>
  );
}

function getPayslipDerivedValues(employee: TemplatePayslipEmployee, snapshot: TemplatePayslipSnapshot) {
  const deMinimisBiMonthly = amount(employee.deminimisAmount) / 2;
  const tardinessAmount = -Math.abs(amount(snapshot.tardinessDeduction));
  const absenceAmount = -Math.abs(amount(snapshot.absencePay));
  const leavesPay = amount(snapshot.silPay) + amount(snapshot.slPay);
  const leaveDays = amount(snapshot.silDays) + amount(snapshot.slHours) / 8;
  const absenceDays = amount(snapshot.absenceHours) / 8;
  const otHours = amount(snapshot.overtimeRegularHours) + amount(snapshot.overtimeExtendedHours);
  const otPay = amount(snapshot.overtimeRegularPay) + amount(snapshot.overtimeExtendedPay);
  const grossIncome = amount(snapshot.grossWithAhop) + deMinimisBiMonthly - Math.abs(amount(snapshot.tardinessDeduction));
  const totalDeductions =
    amount(snapshot.sssEmployee) +
    amount(snapshot.philHealthEmployee) +
    amount(snapshot.pagIbigEmployee) +
    amount(snapshot.loanDeductions) +
    amount(snapshot.probationaryDeduction);
  const netPay = grossIncome + amount(snapshot.salaryAdjustments) - totalDeductions;

  return {
    deMinimisBiMonthly,
    tardinessAmount,
    absenceAmount,
    leavesPay,
    leaveDays,
    absenceDays,
    otHours,
    otPay,
    grossIncome,
    totalDeductions,
    netPay,
  };
}

function amount(value: MoneyLike): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toPeso(value: MoneyLike): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount(value));
}

function toDateLabel(value: Date | string | null | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatQty(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] uppercase tracking-wide text-[#6b7280]">{label}</dt>
      <dd className="mt-0.5 font-semibold text-[#111827]">{value}</dd>
    </div>
  );
}

function TableBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-[#c7c0b3]">
      <div className="border-b border-[#c7c0b3] bg-[#f3f0eb] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#111827]">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Line({
  label,
  quantity,
  value,
  strong,
}: {
  label: string;
  quantity: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[1fr_64px_88px] gap-2 border-b border-[#ebe5dc] px-2 py-1 last:border-b-0 ${
        strong ? "font-bold text-[#111827]" : ""
      }`}
    >
      <span>{label}</span>
      <span className="text-right text-[#4b5563]">{quantity}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  );
}

function MiniTotal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#e4ddd1] px-3 py-2">
      <span className="text-[#6b7280]">{label}</span>
      <span className="font-semibold text-[#1a2e1f]">{value}</span>
    </div>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div>
      <div className="border-t border-[#6b7280] pt-1">{label}</div>
    </div>
  );
}
