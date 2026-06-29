import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

function toPeso(value: { toString(): string } | number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function toDateLabel(value: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default async function PayrollResultsPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;

  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
    include: {
      snapshots: {
        orderBy: { employee: { fullName: "asc" } },
        include: {
          employee: {
            select: {
              fullName: true,
              position: true,
              paymentMethod: true,
              deminimisAmount: true,
              dateStarted: true,
            },
          },
        },
      },
    },
  });

  if (!period) notFound();

  const snapshots = period.snapshots;

  const totals = snapshots.reduce(
    (acc, snap) => ({
      gross: acc.gross + Number(snap.grossWithAhop),
      sssEE: acc.sssEE + Number(snap.sssEmployee),
      sssER: acc.sssER + Number(snap.sssEmployer),
      philHealthEE: acc.philHealthEE + Number(snap.philHealthEmployee),
      philHealthER: acc.philHealthER + Number(snap.philHealthEmployer),
      pagIbigEE: acc.pagIbigEE + Number(snap.pagIbigEmployee),
      pagIbigER: acc.pagIbigER + Number(snap.pagIbigEmployer),
      withholding: acc.withholding + Number(snap.withholdingTax),
      net: acc.net + Number(snap.netPay),
      ahop: acc.ahop + Number(snap.totalAhop || snap.ahopTopup),
    }),
    {
      gross: 0, sssEE: 0, sssER: 0,
      philHealthEE: 0, philHealthER: 0,
      pagIbigEE: 0, pagIbigER: 0,
      withholding: 0, net: 0, ahop: 0,
    }
  );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/admin/payroll" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to payroll
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {period.label} — Results
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {toDateLabel(period.periodStart)} – {toDateLabel(period.periodEnd)} ·{" "}
            {snapshots.length} employees processed
            {period.processedAt
              ? ` · Processed ${toDateLabel(period.processedAt)}`
              : ""}
          </p>
        </div>
        <a
          href={`/api/payroll/${periodId}/export`}
          className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-accent"
        >
          Export CSV
        </a>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total gross" value={toPeso(totals.gross)} />
        <SummaryCard label="Total net pay" value={toPeso(totals.net)} highlight />
        <SummaryCard label="Total AHOP" value={toPeso(totals.ahop)} />
        <SummaryCard
          label="Employer contributions"
          value={toPeso(totals.sssER + totals.philHealthER + totals.pagIbigER)}
        />
      </div>

      {/* Results table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-xs">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-foreground">Employee</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">Basic Pay</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">AHOP</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">OT</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">AOT</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">Holiday</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">OT %</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">Leaves</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">De Minimis</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">Gross</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">SSS EE</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">PhilHealth EE</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">PagIbig EE</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">W/H Tax</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">Other Ded.</th>
              <th className="px-3 py-3 text-right font-semibold text-primary">Net Pay</th>
              <th className="px-3 py-3 text-right font-semibold text-foreground">YTD AHOP</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {snapshots.map((snap) => {
              const otPay = Number(snap.otTotalPay || 0);
              const leavesPay = Number(snap.totalLeavesPay || 0);
              const otherDed = Number(snap.loanDeductions);
              return (
                <tr key={snap.id} className="hover:bg-muted/70">
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground">{snap.employee.fullName}</p>
                    {snap.employee.position ? (
                      <p className="text-muted-foreground">{snap.employee.position}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right text-foreground">{toPeso(snap.regularPay)}</td>
                  <td className="px-3 py-2 text-right text-foreground">{toPeso(snap.coAhop)}</td>
                  <td className="px-3 py-2 text-right text-foreground">{toPeso(otPay)}</td>
                  <td className="px-3 py-2 text-right text-foreground">{toPeso(snap.aotPay)}</td>
                  <td className="px-3 py-2 text-right text-foreground">{toPeso(snap.totalHolidayPay)}</td>
                  <td className="px-3 py-2 text-right text-foreground">{toPeso(snap.extraOtPremium)}</td>
                  <td className="px-3 py-2 text-right text-foreground">{toPeso(leavesPay)}</td>
                  <td className="px-3 py-2 text-right text-foreground">{toPeso(snap.deMinimisPay)}</td>
                  <td className="px-3 py-2 text-right font-medium text-foreground">
                    {toPeso(snap.grossWithAhop)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{toPeso(snap.sssEmployee)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {toPeso(snap.philHealthEmployee)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{toPeso(snap.pagIbigEmployee)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{toPeso(snap.withholdingTax)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{toPeso(otherDed)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">
                    {toPeso(snap.netPay)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{toPeso(snap.ytdAhop)}</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/payroll/${periodId}/payslip/${snap.employeeId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Payslip
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-border bg-background">
            <tr>
              <td className="px-3 py-3 font-semibold text-foreground">Totals</td>
              <td colSpan={7} />
              <td className="px-3 py-3 text-right font-semibold text-foreground">{toPeso(totals.gross)}</td>
              <td className="px-3 py-3 text-right font-semibold text-foreground">{toPeso(totals.sssEE)}</td>
              <td className="px-3 py-3 text-right font-semibold text-foreground">{toPeso(totals.philHealthEE)}</td>
              <td className="px-3 py-3 text-right font-semibold text-foreground">{toPeso(totals.pagIbigEE)}</td>
              <td className="px-3 py-3 text-right font-semibold text-foreground">{toPeso(totals.withholding)}</td>
              <td />
              <td className="px-3 py-3 text-right font-semibold text-foreground">{toPeso(totals.net)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
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
        highlight
          ? "border-primary/30 bg-accent"
          : "border-border bg-card"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
