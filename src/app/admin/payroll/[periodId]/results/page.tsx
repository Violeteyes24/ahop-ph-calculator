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
          <Link href="/admin/payroll" className="text-sm text-[#6b7280] hover:text-[#1a2e1f]">
            ← Back to payroll
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a2e1f]">
            {period.label} — Results
          </h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            {toDateLabel(period.periodStart)} – {toDateLabel(period.periodEnd)} ·{" "}
            {snapshots.length} employees processed
            {period.processedAt
              ? ` · Processed ${toDateLabel(period.processedAt)}`
              : ""}
          </p>
        </div>
        <a
          href={`/api/payroll/${periodId}/export`}
          className="rounded-lg border border-[#2f4f3e] px-4 py-2 text-sm font-semibold text-[#2f4f3e] hover:bg-[#edf3ee]"
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
      <div className="overflow-x-auto rounded-xl border border-[#ddd6ca] bg-white">
        <table className="w-full text-xs">
          <thead className="border-b border-[#ddd6ca] bg-[#f5f0e8]">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-[#374151]">Employee</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">Basic Pay</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">AHOP</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">OT</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">AOT</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">Holiday</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">OT %</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">Leaves</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">De Minimis</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">Gross</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">SSS EE</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">PhilHealth EE</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">PagIbig EE</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">W/H Tax</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">Other Ded.</th>
              <th className="px-3 py-3 text-right font-semibold text-[#2f4f3e]">Net Pay</th>
              <th className="px-3 py-3 text-right font-semibold text-[#374151]">YTD AHOP</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ebe3]">
            {snapshots.map((snap) => {
              const otPay = Number(snap.otTotalPay || 0);
              const leavesPay = Number(snap.totalLeavesPay || 0);
              const otherDed =
                Number(snap.probationaryDeduction) +
                Number(snap.loanDeductions);
              return (
                <tr key={snap.id} className="hover:bg-[#faf8f4]">
                  <td className="px-3 py-2">
                    <p className="font-medium text-[#1a2e1f]">{snap.employee.fullName}</p>
                    {snap.employee.position ? (
                      <p className="text-[#9ca3af]">{snap.employee.position}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right text-[#374151]">{toPeso(snap.regularPay)}</td>
                  <td className="px-3 py-2 text-right text-[#374151]">{toPeso(snap.coAhop)}</td>
                  <td className="px-3 py-2 text-right text-[#374151]">{toPeso(otPay)}</td>
                  <td className="px-3 py-2 text-right text-[#374151]">{toPeso(snap.aotPay)}</td>
                  <td className="px-3 py-2 text-right text-[#374151]">{toPeso(snap.totalHolidayPay)}</td>
                  <td className="px-3 py-2 text-right text-[#374151]">{toPeso(snap.extraOtPremium)}</td>
                  <td className="px-3 py-2 text-right text-[#374151]">{toPeso(leavesPay)}</td>
                  <td className="px-3 py-2 text-right text-[#374151]">{toPeso(snap.deMinimisPay)}</td>
                  <td className="px-3 py-2 text-right font-medium text-[#374151]">
                    {toPeso(snap.grossWithAhop)}
                  </td>
                  <td className="px-3 py-2 text-right text-[#6b7280]">{toPeso(snap.sssEmployee)}</td>
                  <td className="px-3 py-2 text-right text-[#6b7280]">
                    {toPeso(snap.philHealthEmployee)}
                  </td>
                  <td className="px-3 py-2 text-right text-[#6b7280]">{toPeso(snap.pagIbigEmployee)}</td>
                  <td className="px-3 py-2 text-right text-[#6b7280]">{toPeso(snap.withholdingTax)}</td>
                  <td className="px-3 py-2 text-right text-[#6b7280]">{toPeso(otherDed)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-[#1a2e1f]">
                    {toPeso(snap.netPay)}
                  </td>
                  <td className="px-3 py-2 text-right text-[#6b7280]">{toPeso(snap.ytdAhop)}</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/payroll/${periodId}/payslip/${snap.employeeId}`}
                      className="font-medium text-[#2f4f3e] hover:underline"
                    >
                      Payslip
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-[#ddd6ca] bg-[#f5f0e8]">
            <tr>
              <td className="px-3 py-3 font-semibold text-[#374151]">Totals</td>
              <td colSpan={7} />
              <td className="px-3 py-3 text-right font-semibold text-[#374151]">{toPeso(totals.gross)}</td>
              <td className="px-3 py-3 text-right font-semibold text-[#374151]">{toPeso(totals.sssEE)}</td>
              <td className="px-3 py-3 text-right font-semibold text-[#374151]">{toPeso(totals.philHealthEE)}</td>
              <td className="px-3 py-3 text-right font-semibold text-[#374151]">{toPeso(totals.pagIbigEE)}</td>
              <td className="px-3 py-3 text-right font-semibold text-[#374151]">{toPeso(totals.withholding)}</td>
              <td />
              <td className="px-3 py-3 text-right font-semibold text-[#1a2e1f]">{toPeso(totals.net)}</td>
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
          ? "border-[#c3d9c9] bg-[#edf3ee]"
          : "border-[#ddd6ca] bg-white"
      }`}
    >
      <p className="text-xs text-[#6b7280]">{label}</p>
      <p className="mt-1 text-base font-semibold text-[#1a2e1f]">{value}</p>
    </div>
  );
}
