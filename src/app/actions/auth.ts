"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/auth";
import { isInternalEmail } from "@/lib/internal-email";
import { createSession, deleteSession } from "@/lib/session";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export interface LoginActionState {
  error?: string;
}

function getRequestOrigin(headersList: Headers): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol =
    headersList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
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

  if (!isInternalEmail(email)) {
    return { error: "Use your @apneadynamics.org email to sign in." };
  }

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

export async function signInWithGoogleAction(): Promise<void> {
  let nextUrl = "/login?error=google_not_configured";

  if (hasSupabaseConfig()) {
    try {
      const headersList = await headers();
      const origin = getRequestOrigin(headersList);
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/admin/dashboard")}`,
        },
      });

      nextUrl = error || !data.url ? "/login?error=google_sign_in_failed" : data.url;
    } catch {
      nextUrl = "/login?error=google_sign_in_failed";
    }
  }

  redirect(nextUrl);
}
