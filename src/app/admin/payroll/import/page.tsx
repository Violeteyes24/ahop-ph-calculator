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
        <Link href="/admin/payroll" className="text-sm text-muted-foreground hover:text-foreground">
          Back to payroll
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Import payroll workbook
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Parse the Excel source sheet, review warnings, then create a draft payroll period.
        </p>
      </div>

      <PayrollImportForm />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Recent imports
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">File</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No imports yet.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-muted/70">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/admin/payroll/import/${batch.id}`} className="hover:underline">
                        {batch.fileName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{toDateLabel(batch.createdAt)}</td>
                    <td className="px-4 py-3 text-foreground">{batch.status}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {batch.period ? (
                        <Link href={`/admin/payroll/${batch.period.id}`} className="text-primary hover:underline">
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
