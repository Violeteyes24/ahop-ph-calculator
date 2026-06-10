import "server-only";
import type { ContributionRateInputs } from "./ahop";
import { prisma } from "./prisma";

export async function getContributionRatesForPeriod(
  periodStart: Date,
  periodEnd: Date
): Promise<ContributionRateInputs> {
  const config = await prisma.contributionRateConfig.findFirst({
    where: {
      effectiveFrom: { lte: periodEnd },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: periodStart } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });

  if (!config) return {};

  return {
    philHealthRatePct: Number(config.philHealthRate),
    pagIbigEmployeeFixed: Number(config.pagIbigEmployeeFixed),
    pagIbigEmployerFixed: Number(config.pagIbigEmployerFixed),
  };
}
