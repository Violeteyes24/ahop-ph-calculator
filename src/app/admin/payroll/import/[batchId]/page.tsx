import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmPayrollImportAction } from "@/app/actions/import-payroll";
import {
  deserializeExcelPayrollData,
  type SerializedExcelPayrollData,
} from "@/lib/excel-importer";
import { prisma } from "@/lib/prisma";

function toDateLabel(value: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getDefaultLabel(periodStart: Date, periodEnd: Date): string {
  const start = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(periodStart);
  const end = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(periodEnd);
  return `${start}-${end}`;
}

function formatNumber(value: number | undefined): string {
  return Number(value ?? 0).toFixed(2);
}

export default async function PayrollImportPreviewPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const batch = await prisma.payrollImportBatch.findUnique({
    where: { id: batchId },
    include: {
      period: { select: { id: true, label: true } },
    },
  });

  if (!batch) notFound();

  const data = deserializeExcelPayrollData(batch.parsedRows as unknown as SerializedExcelPayrollData);
  const warnings = Array.isArray(batch.warnings) ? (batch.warnings as string[]) : [];
  const reconciliation = batch.reconciliation as
    | {
        totalEmployees?: number;
        matchedEmployees?: number;
        employeesWithDifferences?: number;
        summary?: { totalDifferences?: number };
        text?: string;
      }
    | null;
  const confirmAction = confirmPayrollImportAction.bind(null, batch.id);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/admin/payroll/import" className="text-sm text-muted-foreground hover:text-foreground">
            Back to imports
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Preview import
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {batch.fileName} · {data.employees.length} employees · {toDateLabel(data.periodStart)} to{" "}
            {toDateLabel(data.periodEnd)}
          </p>
        </div>
        <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
          {batch.status}
        </span>
      </div>

      {batch.period ? (
        <div className="mb-6 rounded-xl border border-primary/30 bg-accent px-4 py-3 text-sm text-primary">
          This import has already been persisted to{" "}
          <Link href={`/admin/payroll/${batch.period.id}`} className="font-semibold underline">
            {batch.period.label}
          </Link>
          .
        </div>
      ) : (
        <form action={confirmAction} className="mb-6 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="label" className="text-sm font-medium text-foreground">
                Draft period label
              </label>
              <input
                id="label"
                name="label"
                defaultValue={getDefaultLabel(data.periodStart, data.periodEnd)}
                className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Create draft period
            </button>
          </div>
        </form>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <SummaryCard label="Rows" value={String(data.employees.length)} />
        <SummaryCard label="Matched" value={String(reconciliation?.matchedEmployees ?? 0)} />
        <SummaryCard
          label="With differences"
          value={String(reconciliation?.employeesWithDifferences ?? 0)}
        />
        <SummaryCard label="Warnings" value={String(warnings.length)} highlight={warnings.length > 0} />
      </div>

      {warnings.length > 0 ? (
        <section className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <h2 className="text-sm font-semibold text-yellow-800">Warnings</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-yellow-800">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-background px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Parsed employees</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Position</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Worked hrs</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Days</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Daily</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Monthly</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">OT hrs</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Tardy min</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Tardy ded.</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Loans</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Adjustments</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Sheet gross</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.employees.map((employee) => (
                <tr key={`${employee.name}-${employee.position}`} className="hover:bg-muted/70">
                  <td className="px-4 py-2 font-medium text-foreground">{employee.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{employee.position || "None"}</td>
                  <td className="px-4 py-2 text-right text-foreground">{formatNumber(employee.workedHours)}</td>
                  <td className="px-4 py-2 text-right text-foreground">{formatNumber(employee.workedDays)}</td>
                  <td className="px-4 py-2 text-right text-foreground">{formatNumber(employee.dailyRate)}</td>
                  <td className="px-4 py-2 text-right text-foreground">{formatNumber(employee.monthlyRate)}</td>
                  <td className="px-4 py-2 text-right text-foreground">
                    {formatNumber((employee.rdOtHours ?? 0) + (employee.extendedOtHours ?? 0))}
                  </td>
                  <td className="px-4 py-2 text-right text-foreground">{formatNumber(employee.tardinessMinutes)}</td>
                  <td className="px-4 py-2 text-right text-foreground">{formatNumber(employee.tardinessDeduction)}</td>
                  <td className="px-4 py-2 text-right text-foreground">{formatNumber(employee.loans)}</td>
                  <td className="px-4 py-2 text-right text-foreground">{formatNumber(employee.salaryAdjustments)}</td>
                  <td className="px-4 py-2 text-right text-foreground">{formatNumber(employee.grossIncome)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {reconciliation?.text ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Reconciliation report</h2>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-foreground">
            {reconciliation.text}
          </pre>
        </section>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        highlight ? "border-yellow-200 bg-yellow-50" : "border-border bg-card"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
