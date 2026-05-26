import { prisma } from "@/lib/prisma";

function toPeso(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

function toDateLabel(value: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default async function ReportsPage() {
  const [periods, employees] = await Promise.all([
    prisma.payrollPeriod.findMany({
      where: { status: "COMPLETED" },
      orderBy: { periodStart: "desc" },
      include: {
        snapshots: {
          select: {
            grossWithAhop: true,
            netPay: true,
            sssEmployee: true,
            sssEmployer: true,
            philHealthEmployee: true,
            philHealthEmployer: true,
            pagIbigEmployee: true,
            pagIbigEmployer: true,
          },
        },
      },
    }),
    prisma.employeeProfile.findMany({
      where: { isActive: true },
      orderBy: { fullName: "asc" },
      include: {
        payrollSnapshots: {
          orderBy: { periodEnd: "desc" },
          take: 1,
          select: { ytdAhop: true, periodEnd: true },
        },
      },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1a2e1f]">Reports</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Government remittance and YTD AHOP tracking</p>
      </div>

      {/* Government remittance by period */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#5c665f]">
          Government remittance by period
        </h2>
        {periods.length === 0 ? (
          <div className="rounded-xl border border-[#ddd6ca] bg-white px-6 py-8 text-center text-sm text-[#9ca3af]">
            No completed payroll periods yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#ddd6ca] bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-[#ddd6ca] bg-[#f5f0e8]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#374151]">Period</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#374151]">SSS EE</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#374151]">SSS ER</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#374151]">PhilHealth EE</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#374151]">PhilHealth ER</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#374151]">PagIbig EE</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#374151]">PagIbig ER</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#2f4f3e]">Total Remittance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ebe3]">
                {periods.map((period) => {
                  const sssEE = period.snapshots.reduce((s, snap) => s + Number(snap.sssEmployee), 0);
                  const sssER = period.snapshots.reduce((s, snap) => s + Number(snap.sssEmployer), 0);
                  const phEE = period.snapshots.reduce((s, snap) => s + Number(snap.philHealthEmployee), 0);
                  const phER = period.snapshots.reduce((s, snap) => s + Number(snap.philHealthEmployer), 0);
                  const piEE = period.snapshots.reduce((s, snap) => s + Number(snap.pagIbigEmployee), 0);
                  const piER = period.snapshots.reduce((s, snap) => s + Number(snap.pagIbigEmployer), 0);
                  const total = sssEE + sssER + phEE + phER + piEE + piER;

                  return (
                    <tr key={period.id} className="hover:bg-[#faf8f4]">
                      <td className="px-4 py-3 font-medium text-[#1a2e1f]">{period.label}</td>
                      <td className="px-4 py-3 text-right text-[#374151]">{toPeso(sssEE)}</td>
                      <td className="px-4 py-3 text-right text-[#374151]">{toPeso(sssER)}</td>
                      <td className="px-4 py-3 text-right text-[#374151]">{toPeso(phEE)}</td>
                      <td className="px-4 py-3 text-right text-[#374151]">{toPeso(phER)}</td>
                      <td className="px-4 py-3 text-right text-[#374151]">{toPeso(piEE)}</td>
                      <td className="px-4 py-3 text-right text-[#374151]">{toPeso(piER)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#1a2e1f]">
                        {toPeso(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* YTD AHOP tracker */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#5c665f]">
          YTD AHOP tracker (current year)
        </h2>
        {employees.length === 0 ? (
          <div className="rounded-xl border border-[#ddd6ca] bg-white px-6 py-8 text-center text-sm text-[#9ca3af]">
            No active employees.
          </div>
        ) : (
          <div className="rounded-xl border border-[#ddd6ca] bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-[#ddd6ca] bg-[#f5f0e8]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#374151]">Employee</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#374151]">Last period date</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#2f4f3e]">YTD AHOP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ebe3]">
                {employees.map((emp) => {
                  const lastSnap = emp.payrollSnapshots[0];
                  return (
                    <tr key={emp.id} className="hover:bg-[#faf8f4]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1a2e1f]">{emp.fullName}</p>
                        {emp.position ? (
                          <p className="text-xs text-[#9ca3af]">{emp.position}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right text-[#6b7280]">
                        {lastSnap ? toDateLabel(lastSnap.periodEnd) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#1a2e1f]">
                        {lastSnap ? toPeso(Number(lastSnap.ytdAhop)) : toPeso(0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
