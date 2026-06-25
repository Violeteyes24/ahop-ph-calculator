import { prisma } from "@/lib/prisma";
import Link from "next/link";

function toPeso(value: { toString(): string } | number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const employees = await prisma.employeeProfile.findMany({
    where: q
      ? { fullName: { contains: q, mode: "insensitive" } }
      : undefined,
    orderBy: { fullName: "asc" },
    include: { user: { select: { email: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">{employees.length} employee{employees.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/admin/employees/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Add employee
        </Link>
      </div>

      <form method="get" className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name…"
          className="w-full max-w-sm rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </form>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Position</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Salary Type</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Rate</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Stage</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No employees found.{" "}
                  <Link href="/admin/employees/new" className="text-primary underline">
                    Add the first one.
                  </Link>
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/70">
                  <td className="px-4 py-3 font-medium text-foreground">{emp.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.position || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-primary">
                      {emp.salaryType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {emp.salaryType === "DAILY"
                      ? `${toPeso(emp.dailyRate)}/day`
                      : `${toPeso(emp.monthlyRate)}/mo`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.employmentStage}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        emp.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {emp.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/employees/${emp.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View
                    </Link>
                    {" · "}
                    <Link
                      href={`/admin/employees/${emp.id}/edit`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Edit
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
