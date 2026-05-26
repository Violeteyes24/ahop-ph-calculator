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
          <h1 className="text-2xl font-semibold tracking-tight text-[#1a2e1f]">Employees</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{employees.length} employee{employees.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/admin/employees/new"
          className="rounded-lg bg-[#2f4f3e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#274636]"
        >
          Add employee
        </Link>
      </div>

      <form method="get" className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name…"
          className="w-full max-w-sm rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#2f4f3e] focus:ring-1 focus:ring-[#2f4f3e]"
        />
      </form>

      <div className="rounded-xl border border-[#ddd6ca] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#ddd6ca] bg-[#f5f0e8]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[#374151]">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-[#374151]">Position</th>
              <th className="px-4 py-3 text-left font-semibold text-[#374151]">Salary Type</th>
              <th className="px-4 py-3 text-left font-semibold text-[#374151]">Rate</th>
              <th className="px-4 py-3 text-left font-semibold text-[#374151]">Stage</th>
              <th className="px-4 py-3 text-left font-semibold text-[#374151]">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ebe3]">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#9ca3af]">
                  No employees found.{" "}
                  <Link href="/admin/employees/new" className="text-[#2f4f3e] underline">
                    Add the first one.
                  </Link>
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#faf8f4]">
                  <td className="px-4 py-3 font-medium text-[#1a2e1f]">{emp.fullName}</td>
                  <td className="px-4 py-3 text-[#6b7280]">{emp.position || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#edf3ee] px-2 py-0.5 text-xs font-medium text-[#2f4f3e]">
                      {emp.salaryType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#374151]">
                    {emp.salaryType === "DAILY"
                      ? `${toPeso(emp.dailyRate)}/day`
                      : `${toPeso(emp.monthlyRate)}/mo`}
                  </td>
                  <td className="px-4 py-3 text-[#6b7280]">{emp.employmentStage}</td>
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
                      className="text-xs font-medium text-[#2f4f3e] hover:underline"
                    >
                      View
                    </Link>
                    {" · "}
                    <Link
                      href={`/admin/employees/${emp.id}/edit`}
                      className="text-xs font-medium text-[#2f4f3e] hover:underline"
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
