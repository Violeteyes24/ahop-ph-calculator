import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/payroll/print-button";
import { TemplatePayslip } from "@/components/payroll/template-payslip";
import { prisma } from "@/lib/prisma";

function toDateLabel(value: Date | string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default async function AdminPayslipPage({
  params,
}: {
  params: Promise<{ periodId: string; employeeId: string }>;
}) {
  const { periodId, employeeId } = await params;

  const snap = await prisma.payrollSnapshot.findFirst({
    where: { periodId, employeeId },
    include: {
      employee: true,
      period: true,
    },
  });

  if (!snap) notFound();

  const periodLabel = snap.period?.label ?? `${toDateLabel(snap.periodStart)} to ${toDateLabel(snap.periodEnd)}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href={`/admin/payroll/${periodId}/results`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to results
        </Link>
        <PrintButton label="Print payslip" />
      </div>

      <TemplatePayslip
        employee={snap.employee}
        snapshot={snap}
        periodLabel={periodLabel}
        showEmployerContributions
      />
    </div>
  );
}
