"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CAN_EDIT, onlyParticular } from "@/lib/roles";
import { formObject, zodFieldErrors, type FormState } from "@/lib/form";
import { parseMoneyToCents } from "@/lib/format";
import { dateOnly, repasseCents } from "@/lib/finance";
import { dayRange, isDayKey } from "@/lib/time";

const METHODS = ["PIX", "DINHEIRO", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA", "BOLETO", "CONVENIO"] as const;
const CATEGORIES = ["ALUGUEL", "SALARIOS", "REPASSE", "MATERIAIS", "IMPOSTOS", "SERVICOS", "MANUTENCAO", "OUTROS"] as const;

const money = z
  .string({ error: "Informe o valor." })
  .transform(parseMoneyToCents)
  .refine((v) => Number.isFinite(v) && v > 0, "Informe um valor maior que zero.");

const paymentSchema = z.object({
  method: z.enum(METHODS, { error: "Escolha a forma de pagamento." }),
  paidAt: z.string({ error: "Informe a data." }).refine(isDayKey, "Data inválida."),
  amount: money,
  notes: z.string().optional(),
});

export async function registerPayment(patientId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole(...CAN_EDIT.recebimentos);
  const parsed = paymentSchema.safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const appointmentIds = formData.getAll("appointmentIds").map(String);
  if (appointmentIds.length === 0) return { error: "Marque as sessões que estão sendo pagas." };
  const d = parsed.data;

  try {
    await db.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: { patientId, amountCents: d.amount, method: d.method, paidAt: dateOnly(d.paidAt), notes: d.notes ?? null, createdById: session.userId },
      });
      const { count } = await tx.appointment.updateMany({
        where: {
          id: { in: appointmentIds },
          patientId,
          paymentId: null,
          status: { not: "CANCELADO" },
          ...(onlyParticular(session.role) ? { healthPlanId: null } : {}),
        },
        data: { paymentId: payment.id },
      });
      // Outra pessoa pode ter recebido alguma dessas sessões ao mesmo tempo.
      if (count !== appointmentIds.length) throw new Error("SESSOES_INDISPONIVEIS");
    });
  } catch (e) {
    if (e instanceof Error && e.message === "SESSOES_INDISPONIVEIS") {
      return { error: "Alguma das sessões marcadas já foi paga ou cancelada. Atualize a página e tente de novo." };
    }
    throw e;
  }
  revalidatePath("/financeiro", "layout");
  redirect(`/financeiro/receber/${patientId}?ok=1`);
}

export async function deletePayment(formData: FormData) {
  await requireRole(...CAN_EDIT.despesas);
  const id = String(formData.get("id"));
  const payment = await db.payment.findUnique({ where: { id } });
  if (!payment) return;
  await db.payment.delete({ where: { id } });
  revalidatePath("/financeiro", "layout");
}

const expenseSchema = z.object({
  description: z.string({ error: "Descreva a despesa." }).min(2, "Descreva a despesa."),
  category: z.enum(CATEGORIES, { error: "Escolha a categoria." }),
  amount: money,
  dueDate: z.string({ error: "Informe o vencimento." }).refine(isDayKey, "Data inválida."),
  paidAt: z.string().refine(isDayKey, "Data inválida.").optional(),
  notes: z.string().optional(),
});

export async function saveExpense(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(...CAN_EDIT.despesas);
  const parsed = expenseSchema.safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const d = parsed.data;
  const data = {
    description: d.description,
    category: d.category,
    amountCents: d.amount,
    dueDate: dateOnly(d.dueDate),
    paidAt: d.paidAt ? dateOnly(d.paidAt) : null,
    notes: d.notes ?? null,
  };
  if (id) await db.expense.update({ where: { id }, data });
  else await db.expense.create({ data });
  revalidatePath("/financeiro", "layout");
  redirect(`/financeiro/despesas?mes=${d.dueDate.slice(0, 7)}`);
}

export async function markExpensePaid(formData: FormData) {
  await requireRole(...CAN_EDIT.despesas);
  const id = String(formData.get("id"));
  const paidAt = String(formData.get("paidAt") ?? "");
  await db.expense.update({ where: { id }, data: { paidAt: isDayKey(paidAt) ? dateOnly(paidAt) : null } });
  revalidatePath("/financeiro", "layout");
}

export async function deleteExpense(formData: FormData) {
  await requireRole(...CAN_EDIT.despesas);
  await db.expense.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/financeiro", "layout");
}

/** Lança como despesa o repasse do mês de um profissional (uma vez por mês). */
export async function launchRepasse(formData: FormData) {
  await requireRole(...CAN_EDIT.despesas);
  const professionalId = String(formData.get("professionalId"));
  const month = String(formData.get("month"));
  if (!/^\d{4}-\d{2}$/.test(month)) return;

  const professional = await db.professional.findUnique({ where: { id: professionalId } });
  if (!professional) return;
  const start = dayRange(`${month}-01`).start;
  const [y, m] = month.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
  const end = dayRange(`${nextMonth}-01`).start;

  const sessions = await db.appointment.findMany({
    where: { professionalId, status: "REALIZADO", startsAt: { gte: start, lt: end } },
    select: { priceCents: true },
  });
  const amount = sessions.reduce((s, a) => s + repasseCents(professional, a.priceCents), 0);
  if (amount <= 0) return;

  await db.expense.upsert({
    where: { professionalId_period: { professionalId, period: month } },
    update: {},
    create: {
      description: `Repasse ${month.slice(5)}/${month.slice(0, 4)} · ${professional.name}`,
      category: "REPASSE",
      amountCents: amount,
      dueDate: dateOnly(`${nextMonth}-05`),
      professionalId,
      period: month,
    },
  });
  revalidatePath("/financeiro", "layout");
}
