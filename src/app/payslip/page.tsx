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
        <h1 className="text-2xl font-semibold tracking-tight text-[#1a2e1f]">
          My Payslips
        </h1>
        {employee ? (
          <p className="mt-1 text-sm text-[#6b7280]">{employee.fullName} · {employee.position ?? ""}</p>
        ) : null}
      </div>

      {snapshots.length === 0 ? (
        <div className="rounded-xl border border-[#ddd6ca] bg-white px-6 py-12 text-center text-sm text-[#9ca3af]">
          No payslips yet. Your payslips will appear here once payroll has been processed.
        </div>
      ) : (
        <div className="rounded-xl border border-[#ddd6ca] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[#ddd6ca] bg-[#f5f0e8]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#374151]">Period</th>
                <th className="px-4 py-3 text-right font-semibold text-[#374151]">Gross</th>
                <th className="px-4 py-3 text-right font-semibold text-[#374151]">Net Pay</th>
                <th className="px-4 py-3 text-right font-semibold text-[#374151]">AHOP</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ebe3]">
              {snapshots.map((snap) => (
                <tr key={snap.id} className="hover:bg-[#faf8f4]">
                  <td className="px-4 py-3 text-[#1a2e1f]">
                    {snap.period?.label ??
                      `${toDateLabel(snap.periodStart)} – ${toDateLabel(snap.periodEnd)}`}
                  </td>
                  <td className="px-4 py-3 text-right text-[#374151]">
                    {toPeso(snap.grossWithAhop)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1a2e1f]">
                    {toPeso(snap.netPay)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#6b7280]">
                    {toPeso(snap.ahopTopup)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {snap.period ? (
                      <Link
                        href={`/payslip/${snap.period.id}`}
                        className="text-xs font-medium text-[#2f4f3e] hover:underline"
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
