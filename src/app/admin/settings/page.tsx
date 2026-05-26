import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./form";

function toDateLabel(value: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default async function SettingsPage() {
  const configs = await prisma.contributionRateConfig.findMany({
    orderBy: { effectiveFrom: "desc" },
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1a2e1f]">Settings</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          Manage contribution rate configurations for SSS, PhilHealth, and Pag-IBIG.
        </p>
      </div>

      {/* Existing configs */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#5c665f]">
          Rate configurations
        </h2>
        <div className="rounded-xl border border-[#ddd6ca] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[#ddd6ca] bg-[#f5f0e8]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#374151]">Name</th>
                <th className="px-4 py-3 text-right font-semibold text-[#374151]">PhilHealth %</th>
                <th className="px-4 py-3 text-right font-semibold text-[#374151]">PagIbig EE/ER</th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151]">Effective from</th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151]">Effective to</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ebe3]">
              {configs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#9ca3af]">
                    No configurations yet.
                  </td>
                </tr>
              ) : (
                configs.map((config) => (
                  <tr key={config.id} className="hover:bg-[#faf8f4]">
                    <td className="px-4 py-3 font-medium text-[#1a2e1f]">{config.name}</td>
                    <td className="px-4 py-3 text-right text-[#374151]">
                      {Number(config.philHealthRate)}%
                    </td>
                    <td className="px-4 py-3 text-right text-[#374151]">
                      ₱{Number(config.pagIbigEmployeeFixed)} / ₱{Number(config.pagIbigEmployerFixed)}
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">
                      {toDateLabel(config.effectiveFrom)}
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">
                      {config.effectiveTo ? toDateLabel(config.effectiveTo) : "Current"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add new config */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#5c665f]">
          Add rate configuration
        </h2>
        <SettingsForm />
      </section>
    </div>
  );
}
