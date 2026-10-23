"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { formObject, isUniqueViolation, zodFieldErrors, type FormState } from "@/lib/form";

const schema = z.object({
  name: z.string({ error: "Informe o nome." }).min(2, "Informe o nome."),
  email: z.email({ error: "E-mail inválido." }).transform((v) => v.toLowerCase()),
  role: z.enum(["ADMIN", "RECEPCAO", "PROFISSIONAL", "FINANCEIRO"], { error: "Escolha o perfil." }),
  professionalId: z.string().optional(),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").optional(),
});

export async function saveUser(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole(...CAN_EDIT.usuarios);
  const parsed = schema.safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const d = parsed.data;
  if (!id && !d.password) return { fieldErrors: { password: "Defina uma senha inicial." } };
  if (d.role === "PROFISSIONAL" && !d.professionalId) {
    return { fieldErrors: { professionalId: "Vincule o usuário a um profissional." } };
  }
  const active = formData.get("active") === "on" || id === null;
  if (id === session.userId && (!active || d.role !== "ADMIN")) {
    return { error: "Você não pode desativar nem tirar o perfil de administrador da sua própria conta." };
  }

  const data = {
    name: d.name,
    email: d.email,
    role: d.role,
    professionalId: d.role === "PROFISSIONAL" ? d.professionalId! : null,
    active,
    ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 10) } : {}),
  };

  try {
    if (id) await db.user.update({ where: { id }, data });
    else await db.user.create({ data: { ...data, passwordHash: data.passwordHash! } });
  } catch (e) {
    if (isUniqueViolation(e)) {
      const target = String((e as { meta?: { target?: unknown } }).meta?.target ?? "");
      return target.includes("professional")
        ? { fieldErrors: { professionalId: "Este profissional já tem um usuário." } }
        : { fieldErrors: { email: "Já existe um usuário com este e-mail." } };
    }
    throw e;
  }
  revalidatePath("/usuarios");
  redirect("/usuarios");
}
