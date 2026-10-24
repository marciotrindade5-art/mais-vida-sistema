"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { formObject, isUniqueViolation, zodFieldErrors, type FormState } from "@/lib/form";

const schema = z.object({
  name: z.string({ error: "Informe o nome da unidade." }).min(1, "Informe o nome da unidade."),
});

export async function saveUnit(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(...CAN_EDIT.unidades);
  const parsed = schema.safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const data = { name: parsed.data.name, active: formData.get("active") === "on" || id === null };
  try {
    if (id) await db.unit.update({ where: { id }, data });
    else await db.unit.create({ data });
  } catch (e) {
    if (isUniqueViolation(e)) return { fieldErrors: { name: "Já existe uma unidade com este nome." } };
    throw e;
  }
  revalidatePath("/unidades");
  redirect("/unidades");
}
