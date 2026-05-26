"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const rateConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  philHealthRate: z.string().min(1, "PhilHealth rate is required"),
  pagIbigEmployeeFixed: z.string().min(1, "Pag-IBIG employee amount is required"),
  pagIbigEmployerFixed: z.string().min(1, "Pag-IBIG employer amount is required"),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
  effectiveTo: z.string().optional(),
});

export interface SettingsActionState {
  error?: string;
  success?: boolean;
}

export async function createRateConfigAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = rateConfigSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  await prisma.contributionRateConfig.create({
    data: {
      name: data.name,
      philHealthRate: parseFloat(data.philHealthRate),
      pagIbigEmployeeFixed: parseFloat(data.pagIbigEmployeeFixed),
      pagIbigEmployerFixed: parseFloat(data.pagIbigEmployerFixed),
      effectiveFrom: new Date(data.effectiveFrom),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
