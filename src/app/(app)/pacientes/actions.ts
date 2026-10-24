"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { formObject, isUniqueViolation, zodFieldErrors, type FormState } from "@/lib/form";
import { onlyDigits } from "@/lib/format";

const schema = z.object({
  name: z.string({ error: "Informe o nome." }).min(2, "Informe o nome."),
  birthDate: z.iso.date({ error: "Data inválida." }).optional(),
  cpf: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length === 11, "CPF deve ter 11 dígitos.")
    .optional(),
  phone: z.string().optional(),
  email: z.email("E-mail inválido.").optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  healthPlanId: z.string().optional(),
  cardNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function savePatient(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(...CAN_EDIT.pacientes);
  const parsed = schema.safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const { birthDate, ...rest } = parsed.data;
  if (rest.healthPlanId && !rest.cardNumber) return { fieldErrors: { cardNumber: "Informe o número da carteirinha." } };
  const data = {
    ...rest,
    cpf: rest.cpf ?? null,
    phone: rest.phone ?? null,
    email: rest.email ?? null,
    guardianName: rest.guardianName ?? null,
    guardianPhone: rest.guardianPhone ?? null,
    healthPlanId: rest.healthPlanId ?? null,
    // Particular não tem carteirinha.
    cardNumber: rest.healthPlanId ? (rest.cardNumber ?? null) : null,
    notes: rest.notes ?? null,
    birthDate: birthDate ? new Date(birthDate) : null,
    active: formData.get("active") === "on" || id === null,
  };

  try {
    if (id) await db.patient.update({ where: { id }, data });
    else await db.patient.create({ data });
  } catch (e) {
    if (isUniqueViolation(e)) return { fieldErrors: { cpf: "Já existe um paciente com este CPF." } };
    throw e;
  }
  revalidatePath("/pacientes");
  redirect("/pacientes");
}
