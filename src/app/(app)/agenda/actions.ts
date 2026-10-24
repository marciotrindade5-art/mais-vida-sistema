"use server";

import { randomUUID } from "node:crypto";
import type { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentProfessionalId, requireRole } from "@/lib/auth";
import { CAN_EDIT, SEE_PRICES, hasRole } from "@/lib/roles";
import { MAX_PATIENTS_PER_SESSION, findConflicts, type Slot } from "@/lib/agenda";
import { sessionPrice } from "@/lib/pricing";
import { formObject, zodFieldErrors, type FormState } from "@/lib/form";
import { parseMoneyToCents } from "@/lib/format";
import { addDays, formatTime, isDayKey, localToDate, weekday } from "@/lib/time";

const MAX_OCCURRENCES = 200;
const MAX_REPEAT_DAYS = 366;

const schema = z.object({
  patientId: z.string({ error: "Escolha o paciente." }),
  patientId2: z.string().optional(),
  professionalId: z.string({ error: "Escolha o profissional." }),
  roomId: z.string({ error: "Escolha a sala." }),
  date: z.string({ error: "Informe a data." }).refine(isDayKey, "Data inválida."),
  time: z.string({ error: "Informe o horário." }).regex(/^\d{2}:\d{2}$/, "Horário inválido."),
  duration: z.coerce.number({ error: "Informe a duração." }).int().min(10, "Mínimo de 10 minutos.").max(600, "Máximo de 10 horas."),
  price: z
    .string()
    .optional()
    .transform((v) => (v ? parseMoneyToCents(v) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Valor inválido."),
  notes: z.string().optional(),
  repeat: z.enum(["none", "weekly"]).default("none"),
  until: z.string().optional(),
});

/** Gera os horários da recorrência semanal nos dias marcados, até a data final (inclusive). */
function weeklySlots(start: string, until: string, weekdays: number[], time: string, duration: number): Slot[] {
  const slots: Slot[] = [];
  for (let day = start; day <= until && slots.length < MAX_OCCURRENCES; day = addDays(day, 1)) {
    if (!weekdays.includes(weekday(day))) continue;
    const startsAt = localToDate(day, time);
    slots.push({ startsAt, endsAt: new Date(startsAt.getTime() + duration * 60_000) });
  }
  return slots;
}

function describeConflicts(conflicts: Awaited<ReturnType<typeof findConflicts>>, input: { roomId: string; professionalId: string; patientIds: string[]; allowSharing: boolean }) {
  const lines = conflicts.slice(0, 3).map((c) => {
    const quando = `${new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }).format(c.startsAt)} às ${formatTime(c.startsAt)}`;
    const full = input.allowSharing && c.professionalId === input.professionalId && c.roomId === input.roomId && !input.patientIds.includes(c.patientId);
    const motivo = full
      ? `o atendimento já tem ${MAX_PATIENTS_PER_SESSION} pacientes`
      : c.roomId === input.roomId
        ? `${c.room.name} já está ocupada`
        : c.professionalId === input.professionalId
          ? `${c.professional.name} já atende ${c.patient.name}`
          : `${c.patient.name} já tem sessão com ${c.professional.name}`;
    return `${quando}: ${motivo}`;
  });
  return `Conflito de horário. ${lines.join("; ")}.`;
}

export async function saveAppointment(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole(...CAN_EDIT.agenda);
  const canSetPrice = hasRole(session.role, SEE_PRICES);
  const parsed = schema.safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const d = parsed.data;

  const patientIds = id || !d.patientId2 ? [d.patientId] : [d.patientId, d.patientId2];
  if (patientIds.length === 2 && patientIds[0] === patientIds[1]) return { fieldErrors: { patientId2: "Escolha outro paciente." } };

  const professional = await db.professional.findUnique({ where: { id: d.professionalId } });
  if (!professional) return { fieldErrors: { professionalId: "Profissional não encontrado." } };

  const startsAt = localToDate(d.date, d.time);
  let slots: Slot[] = [{ startsAt, endsAt: new Date(startsAt.getTime() + d.duration * 60_000) }];

  if (!id && d.repeat === "weekly") {
    const weekdays = formData.getAll("weekdays").map(Number).filter((n) => n >= 0 && n <= 6);
    if (weekdays.length === 0) return { fieldErrors: { weekdays: "Marque pelo menos um dia da semana." } };
    if (!d.until || !isDayKey(d.until) || d.until < d.date) return { fieldErrors: { until: "Informe uma data final depois do início." } };
    if (d.until > addDays(d.date, MAX_REPEAT_DAYS)) return { fieldErrors: { until: "A recorrência pode ter no máximo 1 ano." } };
    slots = weeklySlots(d.date, d.until, weekdays, d.time, d.duration);
    if (slots.length === 0) return { fieldErrors: { weekdays: "Nenhuma data cai nos dias marcados." } };
  }

  // Juntar a um atendimento existente só quando pedido (dupla) ou quando a sessão continua no mesmo lugar e horário.
  const current = id ? await db.appointment.findUnique({ where: { id } }) : null;
  if (id && !current) return { error: "Sessão não encontrada." };
  const unchanged =
    !!current &&
    current.professionalId === d.professionalId &&
    current.roomId === d.roomId &&
    current.startsAt.getTime() === slots[0].startsAt.getTime() &&
    current.endsAt.getTime() === slots[0].endsAt.getTime();
  const allowSharing = formData.get("dupla") === "on" || unchanged;
  const conflicts = await findConflicts({
    allowSharing,
    slots,
    roomId: d.roomId,
    professionalId: d.professionalId,
    patientIds,
    ignoreIds: id ? [id] : [],
  });
  if (conflicts.length > 0) return { error: describeConflicts(conflicts, { ...d, patientIds, allowSharing }) };

  // O valor vem da tabela de preços; só administrador e financeiro podem trocar à mão.
  async function priceFor(patientId: string) {
    const fromTable = await sessionPrice(patientId, professional!.specialtyId);
    return canSetPrice && d.price !== null ? { ...fromTable, priceCents: d.price } : fromTable;
  }

  const base = {
    professionalId: d.professionalId,
    specialtyId: professional.specialtyId,
    roomId: d.roomId,
    notes: d.notes ?? null,
  };

  if (current) {
    // Sem mudar paciente nem especialidade, quem não vê valores mantém o valor que já estava.
    const keepPrice = !canSetPrice && current.patientId === d.patientId && current.specialtyId === professional.specialtyId;
    const price = keepPrice ? { priceCents: current.priceCents, healthPlanId: current.healthPlanId } : await priceFor(d.patientId);
    await db.appointment.update({
      where: { id: current.id },
      data: { ...base, ...price, patientId: d.patientId, startsAt: slots[0].startsAt, endsAt: slots[0].endsAt },
    });
  } else {
    const rows = [];
    for (const patientId of patientIds) {
      const price = await priceFor(patientId);
      const seriesId = slots.length > 1 ? randomUUID() : null;
      rows.push(...slots.map((s) => ({ ...base, ...price, ...s, patientId, seriesId })));
    }
    await db.appointment.createMany({ data: rows });
  }

  const room = await db.room.findUnique({ where: { id: d.roomId }, select: { unitId: true } });
  revalidatePath("/agenda");
  redirect(`/agenda?data=${d.date}${room ? `&unidade=${room.unitId}` : ""}`);
}

const STATUS_VALUES = ["AGENDADO", "CONFIRMADO", "REALIZADO", "FALTA", "CANCELADO"] as const;

export async function setAppointmentStatus(formData: FormData) {
  const session = await requireRole("ADMIN", "RECEPCAO", "PROFISSIONAL");
  const id = String(formData.get("id"));
  const status = z.enum(STATUS_VALUES).parse(formData.get("status")) as AppointmentStatus;
  const scope = formData.get("scope") === "following" ? "following" : "this";

  const appointment = await db.appointment.findUnique({ where: { id } });
  if (!appointment) return;
  // Presença e falta só fazem sentido depois que a sessão começou.
  if ((status === "REALIZADO" || status === "FALTA") && appointment.startsAt > new Date()) return;

  if (!hasRole(session.role, CAN_EDIT.agenda)) {
    // Profissional só registra presença ou falta nas próprias sessões.
    const professionalId = await currentProfessionalId(session.userId);
    if (appointment.professionalId !== professionalId || !["REALIZADO", "FALTA"].includes(status)) return;
  }

  if (scope === "following" && appointment.seriesId) {
    await db.appointment.updateMany({
      where: { seriesId: appointment.seriesId, startsAt: { gte: appointment.startsAt }, status: { in: ["AGENDADO", "CONFIRMADO"] } },
      data: { status },
    });
  } else {
    await db.appointment.update({ where: { id }, data: { status } });
  }
  revalidatePath("/agenda");
}
