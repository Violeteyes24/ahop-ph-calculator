import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { toggleEmployeeActiveAction } from "@/app/actions/employees";

function toPeso(value: { toString(): string } | number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function toDateLabel(value: Date | string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default async function EmployeeViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const employee = await prisma.employeeProfile.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, role: true } },
      payrollSnapshots: {
        orderBy: { periodEnd: "desc" },
        take: 5,
        include: { period: { select: { label: true } } },
      },
    },
  });

  if (!employee) notFound();

  const toggleActive = toggleEmployeeActiveAction.bind(null, id, !employee.isActive);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/admin/employees" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to employees
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {employee.fullName}
          </h1>
          <p className="text-sm text-muted-foreground">{employee.position || "No position set"}</p>
        </div>
        <div className="flex gap-2">
          <form action={toggleActive}>
            <button
              type="submit"
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                employee.isActive
                  ? "border-red-200 text-red-700 hover:bg-red-50"
                  : "border-green-200 text-green-700 hover:bg-green-50"
              }`}
            >
              {employee.isActive ? "Deactivate" : "Activate"}
            </button>
          </form>
          <Link
            href={`/admin/employees/${id}/edit`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Profile</h2>
          <dl className="grid gap-3 text-sm">
            <Row label="Date started" value={toDateLabel(employee.dateStarted)} />
            <Row label="Employment stage" value={employee.employmentStage} />
            <Row label="Salary type" value={employee.salaryType} />
            <Row label="Salary category" value={employee.salaryCategory} />
            <Row
              label="Daily rate"
              value={employee.dailyRate ? toPeso(employee.dailyRate) : "—"}
            />
            <Row
              label="Monthly rate"
              value={employee.monthlyRate ? toPeso(employee.monthlyRate) : "—"}
            />
            <Row
              label="Probationary deduction"
              value={`${Number(employee.probationaryDeductionPct)}%`}
            />
            <Row label="Payment method" value={employee.paymentMethod} />
            <Row label="De Minimis" value={toPeso(employee.deminimisAmount)} />
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Account</h2>
          <dl className="grid gap-3 text-sm">
            <Row label="Email" value={employee.user?.email ?? "No account"} />
            <Row label="Role" value={employee.user?.role ?? "—"} />
            <Row label="Status" value={employee.isActive ? "Active" : "Inactive"} />
          </dl>
        </div>
      </div>

      {employee.payrollSnapshots.length > 0 ? (
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Recent payroll history
          </h2>
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="pb-2 text-left font-semibold text-foreground">Period</th>
                <th className="pb-2 text-right font-semibold text-foreground">Gross</th>
                <th className="pb-2 text-right font-semibold text-foreground">Net Pay</th>
                <th className="pb-2 text-right font-semibold text-foreground">AHOP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employee.payrollSnapshots.map((snap) => (
                <tr key={snap.id}>
                  <td className="py-2 text-foreground">
                    {snap.period?.label ??
                      `${toDateLabel(snap.periodStart)} – ${toDateLabel(snap.periodEnd)}`}
                  </td>
                  <td className="py-2 text-right text-foreground">{toPeso(snap.grossWithAhop)}</td>
                  <td className="py-2 text-right font-medium text-foreground">{toPeso(snap.netPay)}</td>
                  <td className="py-2 text-right text-muted-foreground">{toPeso(snap.ahopTopup)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
