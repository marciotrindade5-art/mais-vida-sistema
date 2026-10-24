"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { formObject, isUniqueViolation, zodFieldErrors, type FormState } from "@/lib/form";
import { parseMoneyToCents } from "@/lib/format";

const schema = z.object({
  name: z.string({ error: "Informe o nome do plano." }).min(1, "Informe o nome do plano."),
});

export async function saveHealthPlan(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(...CAN_EDIT.planos);
  const fields = formObject(formData);
  const parsed = schema.safeParse(fields);
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  // Um campo "price_<especialidade>" por especialidade; vazio = sem valor definido.
  const prices: { specialtyId: string; priceCents: number }[] = [];
  const fieldErrors: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!key.startsWith("price_") || !value) continue;
    const cents = parseMoneyToCents(value);
    if (!Number.isFinite(cents) || cents < 0) fieldErrors[key] = "Valor inválido.";
    else prices.push({ specialtyId: key.slice(6), priceCents: cents });
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const data = { name: parsed.data.name, active: formData.get("active") === "on" || id === null };
  try {
    await db.$transaction(async (tx) => {
      const plan = id ? await tx.healthPlan.update({ where: { id }, data }) : await tx.healthPlan.create({ data });
      await tx.planPrice.deleteMany({ where: { healthPlanId: plan.id } });
      if (prices.length) await tx.planPrice.createMany({ data: prices.map((p) => ({ ...p, healthPlanId: plan.id })) });
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { fieldErrors: { name: "Já existe um plano com este nome." } };
    throw e;
  }
  revalidatePath("/planos");
  redirect("/planos");
}
