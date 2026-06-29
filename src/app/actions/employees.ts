"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const employeeSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  position: z.string().optional(),
  dateStarted: z.string().min(1, "Date started is required"),
  salaryType: z.enum(["DAILY", "MONTHLY"]),
  salaryCategory: z.enum(["AHOP", "NON_AHOP"]),
  dailyRate: z.string().optional(),
  monthlyRate: z.string().optional(),
  employmentStage: z.enum(["PROBATIONARY", "REGULAR"]),
  paymentMethod: z.enum(["CASH", "BANK"]),
  deminimisAmount: z.string().default("0"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const employeeUpdateSchema = employeeSchema.omit({ email: true, password: true }).extend({
  password: z.string().optional(),
});

export interface EmployeeActionState {
  error?: string;
}

export async function createEmployeeAction(
  _prevState: EmployeeActionState,
  formData: FormData
): Promise<EmployeeActionState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const employee = await prisma.employeeProfile.create({
    data: {
      fullName: data.fullName,
      position: data.position || null,
      dateStarted: new Date(data.dateStarted),
      salaryType: data.salaryType,
      salaryCategory: data.salaryCategory,
      dailyRate: data.dailyRate ? parseFloat(data.dailyRate) : null,
      monthlyRate: data.monthlyRate ? parseFloat(data.monthlyRate) : null,
      employmentStage: data.employmentStage,
      paymentMethod: data.paymentMethod,
      deminimisAmount: parseFloat(data.deminimisAmount),
    },
  });

  await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: "EMPLOYEE",
      employeeId: employee.id,
    },
  });

  revalidatePath("/admin/employees");
  redirect(`/admin/employees/${employee.id}`);
}

export async function updateEmployeeAction(
  id: string,
  _prevState: EmployeeActionState,
  formData: FormData
): Promise<EmployeeActionState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = employeeUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  await prisma.employeeProfile.update({
    where: { id },
    data: {
      fullName: data.fullName,
      position: data.position || null,
      dateStarted: new Date(data.dateStarted),
      salaryType: data.salaryType,
      salaryCategory: data.salaryCategory,
      dailyRate: data.dailyRate ? parseFloat(data.dailyRate) : null,
      monthlyRate: data.monthlyRate ? parseFloat(data.monthlyRate) : null,
      employmentStage: data.employmentStage,
      paymentMethod: data.paymentMethod,
      deminimisAmount: parseFloat(data.deminimisAmount),
    },
  });

  if (data.password) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    await prisma.user.updateMany({
      where: { employeeId: id },
      data: { passwordHash },
    });
  }

  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${id}`);
  redirect(`/admin/employees/${id}`);
}

export async function toggleEmployeeActiveAction(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  await prisma.employeeProfile.update({
    where: { id },
    data: { isActive },
  });
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${id}`);
}
