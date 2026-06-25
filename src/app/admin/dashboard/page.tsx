import { prisma } from "@/lib/prisma";
import Link from "next/link";

function toPeso(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export default async function DashboardPage() {
  const [employeeCount, openPeriod, recentPeriods] = await Promise.all([
    prisma.employeeProfile.count({ where: { isActive: true } }),
    prisma.payrollPeriod.findFirst({
      where: { status: "DRAFT" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payrollPeriod.findMany({
      where: { status: "COMPLETED" },
      orderBy: { periodStart: "desc" },
      take: 5,
      include: {
        _count: { select: { snapshots: true } },
        snapshots: {
          select: { grossWithAhop: true, netPay: true },
        },
      },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of Apnea Dynamics payroll</p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Active employees"
          value={String(employeeCount)}
          action={{ label: "Manage employees", href: "/admin/employees" }}
        />
        <StatCard
          label="Open payroll period"
          value={openPeriod ? openPeriod.label : "None"}
          action={
            openPeriod
              ? { label: "Enter attendance", href: `/admin/payroll/${openPeriod.id}` }
              : { label: "Create new period", href: "/admin/payroll/new" }
          }
        />
        <StatCard
          label="Last completed period"
          value={recentPeriods[0]?.label ?? "—"}
          action={
            recentPeriods[0]
              ? {
                  label: "View results",
                  href: `/admin/payroll/${recentPeriods[0].id}/results`,
                }
              : null
          }
        />
      </div>

      {/* Quick actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/admin/payroll/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          New payroll period
        </Link>
        <Link
          href="/admin/payroll/import"
          className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Import Excel
        </Link>
        <Link
          href="/admin/employees/new"
          className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Add employee
        </Link>
        <Link
          href="/admin/reports"
          className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          View reports
        </Link>
      </div>

      {/* Recent periods */}
      {recentPeriods.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Recent payroll periods</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Period</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Employees</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Total gross</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Total net</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentPeriods.map((period) => {
                const totalGross = period.snapshots.reduce(
                  (s, snap) => s + Number(snap.grossWithAhop),
                  0
                );
                const totalNet = period.snapshots.reduce(
                  (s, snap) => s + Number(snap.netPay),
                  0
                );
                return (
                  <tr key={period.id} className="hover:bg-muted/70">
                    <td className="px-4 py-3 font-medium text-foreground">{period.label}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {period._count.snapshots}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">{toPeso(totalGross)}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {toPeso(totalNet)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/payroll/${period.id}/results`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          No completed payroll periods yet.{" "}
          <Link href="/admin/payroll/new" className="text-primary underline">
            Create the first one.
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action: { label: string; href: string } | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
        >
          {action.label} →
        </Link>
      ) : null}
    </div>
  );
}
