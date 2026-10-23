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
  name: z.string({ error: "Informe o nome." }).min(2, "Informe o nome."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida."),
  defaultMinutes: z.coerce.number({ error: "Informe a duração." }).int().min(10, "Mínimo de 10 minutos.").max(600),
  defaultPrice: z
    .string()
    .optional()
    .transform((v) => (v ? parseMoneyToCents(v) : 0))
    .refine((v) => Number.isFinite(v) && v >= 0, "Valor inválido."),
});

export async function saveSpecialty(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(...CAN_EDIT.especialidades);
  const parsed = schema.safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const { defaultPrice, ...rest } = parsed.data;
  const data = { ...rest, defaultPriceCents: defaultPrice, active: formData.get("active") === "on" || id === null };
  try {
    if (id) await db.specialty.update({ where: { id }, data });
    else await db.specialty.create({ data });
  } catch (e) {
    if (isUniqueViolation(e)) return { fieldErrors: { name: "Já existe uma especialidade com este nome." } };
    throw e;
  }
  revalidatePath("/especialidades");
  redirect("/especialidades");
}
