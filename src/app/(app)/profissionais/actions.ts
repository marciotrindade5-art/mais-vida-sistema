"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT } from "@/lib/roles";
import { formObject, zodFieldErrors, type FormState } from "@/lib/form";
import { parseMoneyToCents } from "@/lib/format";

const schema = z
  .object({
    name: z.string({ error: "Informe o nome." }).min(2, "Informe o nome."),
    specialtyId: z.string({ error: "Escolha a especialidade." }),
    registration: z.string().optional(),
    phone: z.string().optional(),
    email: z.email("E-mail inválido.").optional(),
    repasseTipo: z.enum(["PERCENTUAL", "FIXO_POR_SESSAO"]),
    repasseValor: z.string({ error: "Informe o repasse." }),
  })
  .transform((d, ctx) => {
    const valor = d.repasseTipo === "PERCENTUAL" ? Math.round(Number(d.repasseValor.replace(",", "."))) : parseMoneyToCents(d.repasseValor);
    if (!Number.isFinite(valor) || valor < 0 || (d.repasseTipo === "PERCENTUAL" && valor > 100)) {
      ctx.addIssue({ code: "custom", path: ["repasseValor"], message: d.repasseTipo === "PERCENTUAL" ? "Use um percentual de 0 a 100." : "Valor inválido." });
      return z.NEVER;
    }
    return { ...d, repasseValor: valor };
  });

export async function saveProfessional(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(...CAN_EDIT.profissionais);
  const parsed = schema.safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };

  const d = parsed.data;
  const data = {
    name: d.name,
    specialtyId: d.specialtyId,
    registration: d.registration ?? null,
    phone: d.phone ?? null,
    email: d.email ?? null,
    repasseTipo: d.repasseTipo,
    repasseValor: d.repasseValor,
    active: formData.get("active") === "on" || id === null,
  };
  if (id) await db.professional.update({ where: { id }, data });
  else await db.professional.create({ data });
  revalidatePath("/profissionais");
  redirect("/profissionais");
}
