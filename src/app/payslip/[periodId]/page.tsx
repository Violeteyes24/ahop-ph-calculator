import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/payroll/print-button";
import { TemplatePayslip } from "@/components/payroll/template-payslip";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function toDateLabel(value: Date | string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default async function EmployeePayslipPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const session = await getSession();
  if (!session?.employeeId) redirect("/login");

  const { periodId } = await params;

  const snap = await prisma.payrollSnapshot.findFirst({
    where: { periodId, employeeId: session.employeeId },
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
        <Link href="/payslip" className="text-sm text-[#6b7280] hover:text-[#1a2e1f]">
          My payslips
        </Link>
        <PrintButton />
      </div>

      <TemplatePayslip employee={snap.employee} snapshot={snap} periodLabel={periodLabel} />
    </div>
  );
}
