import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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

export default async function PayslipListPage() {
  const session = await getSession();
  if (!session?.employeeId) {
    redirect("/login");
  }

  const employee = await prisma.employeeProfile.findUnique({
    where: { id: session.employeeId },
  });

  const snapshots = await prisma.payrollSnapshot.findMany({
    where: { employeeId: session.employeeId },
    orderBy: { periodEnd: "desc" },
    include: {
      period: { select: { id: true, label: true, status: true } },
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My Payslips
        </h1>
        {employee ? (
          <p className="mt-1 text-sm text-muted-foreground">{employee.fullName} · {employee.position ?? ""}</p>
        ) : null}
      </div>

      {snapshots.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          No payslips yet. Your payslips will appear here once payroll has been processed.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Period</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Gross</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Net Pay</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">AHOP</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {snapshots.map((snap) => (
                <tr key={snap.id} className="hover:bg-muted/70">
                  <td className="px-4 py-3 text-foreground">
                    {snap.period?.label ??
                      `${toDateLabel(snap.periodStart)} – ${toDateLabel(snap.periodEnd)}`}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {toPeso(snap.grossWithAhop)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {toPeso(snap.netPay)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {toPeso(snap.ahopTopup)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {snap.period ? (
                      <Link
                        href={`/payslip/${snap.period.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View payslip
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
