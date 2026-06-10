import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PayrollImportForm } from "./form";

function toDateLabel(value: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default async function PayrollImportPage() {
  const batches = await prisma.payrollImportBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      period: { select: { id: true, label: true } },
    },
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/payroll" className="text-sm text-[#6b7280] hover:text-[#1a2e1f]">
          Back to payroll
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1a2e1f]">
          Import payroll workbook
        </h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          Parse the Excel source sheet, review warnings, then create a draft payroll period.
        </p>
      </div>

      <PayrollImportForm />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#5c665f]">
          Recent imports
        </h2>
        <div className="overflow-hidden rounded-xl border border-[#ddd6ca] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[#ddd6ca] bg-[#f5f0e8]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#374151]">File</th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151]">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151]">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-[#374151]">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ebe3]">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#9ca3af]">
                    No imports yet.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-[#faf8f4]">
                    <td className="px-4 py-3 font-medium text-[#1a2e1f]">
                      <Link href={`/admin/payroll/import/${batch.id}`} className="hover:underline">
                        {batch.fileName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">{toDateLabel(batch.createdAt)}</td>
                    <td className="px-4 py-3 text-[#374151]">{batch.status}</td>
                    <td className="px-4 py-3 text-right text-[#6b7280]">
                      {batch.period ? (
                        <Link href={`/admin/payroll/${batch.period.id}`} className="text-[#2f4f3e] hover:underline">
                          {batch.period.label}
                        </Link>
                      ) : (
                        "Not persisted"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
