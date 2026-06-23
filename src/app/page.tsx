import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getSession();

  if (!session) {
    redirect("/calculator");
  }

  if (session.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  redirect("/payslip");
}
