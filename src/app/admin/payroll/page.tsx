import { prisma } from "@/lib/prisma";
import Link from "next/link";

function toDateLabel(value: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-yellow-50 text-yellow-700",
  COMPLETED: "bg-green-50 text-green-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export default async function PayrollPeriodsPage() {
  const periods = await prisma.payrollPeriod.findMany({
    orderBy: { periodStart: "desc" },
    include: {
      _count: { select: { snapshots: true, attendanceEntries: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Payroll Periods</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {periods.length} period{periods.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/payroll/import"
            className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Import Excel
          </Link>
          <Link
            href="/admin/payroll/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            New period
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Period</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Date range</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Employees</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {periods.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No payroll periods yet.{" "}
                  <Link href="/admin/payroll/new" className="text-primary underline">
                    Create the first one.
                  </Link>
                </td>
              </tr>
            ) : (
              periods.map((period) => (
                <tr key={period.id} className="hover:bg-muted/70">
                  <td className="px-4 py-3 font-medium text-foreground">{period.label}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {toDateLabel(period.periodStart)} – {toDateLabel(period.periodEnd)}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {period.status === "COMPLETED"
                      ? `${period._count.snapshots} processed`
                      : `${period._count.attendanceEntries} entered`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[period.status] ?? ""}`}
                    >
                      {period.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={
                        period.status === "COMPLETED"
                          ? `/admin/payroll/${period.id}/results`
                          : `/admin/payroll/${period.id}`
                      }
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {period.status === "COMPLETED" ? "View results" : "Enter attendance"}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
