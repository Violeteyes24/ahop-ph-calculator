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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage contribution rate configurations for SSS, PhilHealth, and Pag-IBIG.
        </p>
      </div>

      {/* Existing configs */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Rate configurations
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Name</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">PhilHealth %</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">PagIbig EE/ER</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Effective from</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Effective to</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {configs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No configurations yet.
                  </td>
                </tr>
              ) : (
                configs.map((config) => (
                  <tr key={config.id} className="hover:bg-muted/70">
                    <td className="px-4 py-3 font-medium text-foreground">{config.name}</td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {Number(config.philHealthRate)}%
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      ₱{Number(config.pagIbigEmployeeFixed)} / ₱{Number(config.pagIbigEmployerFixed)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {toDateLabel(config.effectiveFrom)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
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
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Add rate configuration
        </h2>
        <SettingsForm />
      </section>
    </div>
  );
}
