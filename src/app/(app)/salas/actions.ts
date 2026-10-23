"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { formObject, isUniqueViolation, zodFieldErrors, type FormState } from "@/lib/form";

const schema = z.object({
  name: z.string({ error: "Informe o nome da sala." }).min(1, "Informe o nome da sala."),
  description: z.string().optional(),
});

export async function saveRoom(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(...CAN_EDIT.salas);
  const parsed = schema.safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const data = {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    active: formData.get("active") === "on" || id === null,
  };
  try {
    if (id) await db.room.update({ where: { id }, data });
    else await db.room.create({ data });
  } catch (e) {
    if (isUniqueViolation(e)) return { fieldErrors: { name: "Já existe uma sala com este nome." } };
    throw e;
  }
  revalidatePath("/salas");
  redirect("/salas");
}
