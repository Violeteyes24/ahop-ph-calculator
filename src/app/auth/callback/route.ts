import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/auth";
import { isInternalEmail } from "@/lib/internal-email";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEFAULT_NEXT_PATH = "/admin/dashboard";

function redirectToLogin(origin: string, error: string): NextResponse {
  const url = new URL("/login", origin);
  url.searchParams.set("error", error);

  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function redirectToPath(origin: string, path: string): NextResponse {
  const response = NextResponse.redirect(new URL(path, origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  return value;
}

function allowedFinanceEmails(): Set<string> {
  const raw =
    process.env.FINANCE_ALLOWED_EMAILS ??
    process.env.AUTHORIZED_FINANCE_EMAILS ??
    "";

  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function createGoogleOnlyAdmin(email: string) {
  const randomPassword = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(randomPassword, 12);

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
    },
  });
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));
  const origin = requestUrl.origin;

  if (!code) {
    return redirectToLogin(origin, "missing_oauth_code");
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return redirectToLogin(origin, "google_sign_in_failed");
  }

  const {
    data: { user: supabaseUser },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !supabaseUser?.email || !supabaseUser.email_confirmed_at) {
    await supabase.auth.signOut({ scope: "local" });
    return redirectToLogin(origin, "google_identity_unverified");
  }

  const email = supabaseUser.email.trim().toLowerCase();

  if (!isInternalEmail(email)) {
    await supabase.auth.signOut({ scope: "local" });
    return redirectToLogin(origin, "not_internal_email");
  }

  const existingUser = await getUserByEmail(email);
  const allowedEmails = allowedFinanceEmails();

  const appUser =
    existingUser ??
    (allowedEmails.has(email) ? await createGoogleOnlyAdmin(email) : null);

  if (!appUser || appUser.role !== "ADMIN") {
    await supabase.auth.signOut({ scope: "local" });
    return redirectToLogin(origin, "not_authorized_finance");
  }

  await createSession({
    userId: appUser.id,
    role: "ADMIN",
    employeeId: appUser.employeeId ?? null,
  });
  await supabase.auth.signOut({ scope: "local" });

  return redirectToPath(origin, nextPath);
}
