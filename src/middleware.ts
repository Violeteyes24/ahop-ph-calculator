import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/calculator"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and Next.js internals
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ahop_session")?.value;
  const session = token ? await decrypt(token) : null;

  // Root path redirect based on role
  if (pathname === "/") {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    if (session.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    return NextResponse.redirect(new URL("/payslip", request.url));
  }

  // Protect /admin routes — ADMIN only
  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    if (session.role !== "ADMIN") return NextResponse.redirect(new URL("/payslip", request.url));
    return NextResponse.next();
  }

  // Protect /payslip routes — any authenticated user
  if (pathname.startsWith("/payslip")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
