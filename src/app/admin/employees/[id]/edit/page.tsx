import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditEmployeeForm } from "./form";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const employee = await prisma.employeeProfile.findUnique({
    where: { id },
  });

  if (!employee) notFound();

  const defaults = {
    fullName: employee.fullName,
    position: employee.position ?? "",
    dateStarted: employee.dateStarted.toISOString().split("T")[0],
    salaryType: employee.salaryType,
    salaryCategory: employee.salaryCategory,
    dailyRate: employee.dailyRate ? String(employee.dailyRate) : "",
    monthlyRate: employee.monthlyRate ? String(employee.monthlyRate) : "",
    employmentStage: employee.employmentStage,
    paymentMethod: employee.paymentMethod,
    deminimisAmount: String(employee.deminimisAmount),
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href={`/admin/employees/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to employee
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Edit employee</h1>
      </div>
      <EditEmployeeForm id={id} defaults={defaults} />
    </div>
  );
}
