import { requireEmployee } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export default async function PayslipLayout({ children }: { children: React.ReactNode }) {
  await requireEmployee();

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <header className="border-b border-[#ddd6ca] bg-white px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5c665f]">
              Apnea Dynamics Inc.
            </p>
            <p className="text-xs text-[#9ca3af]">My Payslips</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-[#d1d5db] px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f5f0e8]"
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
