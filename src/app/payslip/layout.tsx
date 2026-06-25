import { requireEmployee } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function PayslipLayout({ children }: { children: React.ReactNode }) {
  await requireEmployee();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Apnea Dynamics Inc.
            </p>
            <p className="text-xs text-muted-foreground">My Payslips</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-6">{children}</main>
    </div>
  );
}
