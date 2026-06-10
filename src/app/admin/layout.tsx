import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-[#f5f0e8]">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-[#ddd6ca] bg-white">
        <div className="flex h-14 items-center border-b border-[#ddd6ca] px-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5c665f]">
              Apnea Dynamics
            </p>
            <p className="text-xs text-[#9ca3af]">Payroll System</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3 text-sm">
          <NavLink href="/admin/dashboard">
            <DashboardIcon />
            Dashboard
          </NavLink>
          <NavLink href="/admin/employees">
            <EmployeesIcon />
            Employees
          </NavLink>
          <NavLink href="/admin/payroll">
            <PayrollIcon />
            Payroll
          </NavLink>
          <NavLink href="/admin/payroll/import">
            <ImportIcon />
            Import
          </NavLink>
          <NavLink href="/admin/reports">
            <ReportsIcon />
            Reports
          </NavLink>

          <div className="mt-auto border-t border-[#ddd6ca] pt-3">
            <NavLink href="/admin/settings">
              <SettingsIcon />
              Settings
            </NavLink>
            <form action={logoutAction}>
              <button
                type="submit"
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[#6b7280] hover:bg-[#f5f0e8] hover:text-[#1a2e1f]"
              >
                <LogoutIcon />
                Sign out
              </button>
            </form>
          </div>
        </nav>
      </aside>

      <main className="ml-56 flex-1 p-6">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-[#374151] hover:bg-[#f5f0e8] hover:text-[#1a2e1f]"
    >
      {children}
    </Link>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function EmployeesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20c0-4 2.7-6 6-6s6 2 6 6" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 20c0-3-1.8-5.1-4-5.8" />
    </svg>
  );
}

function PayrollIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M8 14h3" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16" />
      <rect x="6" y="11" width="3" height="7" rx="0.5" />
      <rect x="11" y="8" width="3" height="10" rx="0.5" />
      <rect x="16" y="5" width="3" height="13" rx="0.5" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
