"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/auth";
import { createSession, deleteSession } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export interface LoginActionState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password } = parsed.data;
  const user = await getUserByEmail(email);

  if (!user) {
    return { error: "Invalid email or password" };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return { error: "Invalid email or password" };
  }

  await createSession({
    userId: user.id,
    role: user.role as "ADMIN" | "EMPLOYEE",
    employeeId: user.employeeId ?? null,
  });

  if (user.role === "ADMIN") {
    redirect("/admin/dashboard");
  } else {
    redirect("/payslip");
  }
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
