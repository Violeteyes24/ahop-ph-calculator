import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";
import { prisma } from "./prisma";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  return getSession();
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }
  return session;
}

export async function requireEmployee(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { employee: true },
  });
}
