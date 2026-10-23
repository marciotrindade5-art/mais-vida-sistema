"use server";

import { randomUUID } from "node:crypto";
import type { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentProfessionalId, requireRole } from "@/lib/auth";
import { CAN_EDIT, hasRole } from "@/lib/roles";
import { findConflicts, type Slot } from "@/lib/agenda";
import { formObject, zodFieldErrors, type FormState } from "@/lib/form";
import { parseMoneyToCents } from "@/lib/format";
import { addDays, formatTime, isDayKey, localToDate, weekday } from "@/lib/time";

const MAX_OCCURRENCES = 200;
const MAX_REPEAT_DAYS = 366;

const schema = z.object({
  patientId: z.string({ error: "Escolha o paciente." }),
  professionalId: z.string({ error: "Escolha o profissional." }),
  roomId: z.string({ error: "Escolha a sala." }),
  date: z.string({ error: "Informe a data." }).refine(isDayKey, "Data inválida."),
  time: z.string({ error: "Informe o horário." }).regex(/^\d{2}:\d{2}$/, "Horário inválido."),
  duration: z.coerce.number({ error: "Informe a duração." }).int().min(10, "Mínimo de 10 minutos.").max(600, "Máximo de 10 horas."),
  price: z
    .string()
    .optional()
    .transform((v) => (v ? parseMoneyToCents(v) : 0))
    .refine((v) => Number.isFinite(v) && v >= 0, "Valor inválido."),
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

function describeConflicts(conflicts: Awaited<ReturnType<typeof findConflicts>>, input: { roomId: string; professionalId: string }) {
  const lines = conflicts.slice(0, 3).map((c) => {
    const quando = `${new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }).format(c.startsAt)} às ${formatTime(c.startsAt)}`;
    const motivo =
      c.roomId === input.roomId
        ? `${c.room.name} já está ocupada`
        : c.professionalId === input.professionalId
          ? `${c.professional.name} já atende ${c.patient.name}`
          : `${c.patient.name} já tem sessão com ${c.professional.name}`;
    return `${quando}: ${motivo}`;
  });
  return `Conflito de horário. ${lines.join("; ")}.`;
}

export async function saveAppointment(id: string | null, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole(...CAN_EDIT.agenda);
  const parsed = schema.safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error) };
  const d = parsed.data;

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

  const conflicts = await findConflicts({
    slots,
    roomId: d.roomId,
    professionalId: d.professionalId,
    patientId: d.patientId,
    ignoreIds: id ? [id] : [],
  });
  if (conflicts.length > 0) return { error: describeConflicts(conflicts, d) };

  const base = {
    patientId: d.patientId,
    professionalId: d.professionalId,
    specialtyId: professional.specialtyId,
    roomId: d.roomId,
    priceCents: d.price,
    notes: d.notes ?? null,
  };

  if (id) {
    await db.appointment.update({ where: { id }, data: { ...base, startsAt: slots[0].startsAt, endsAt: slots[0].endsAt } });
  } else {
    const seriesId = slots.length > 1 ? randomUUID() : null;
    await db.appointment.createMany({ data: slots.map((s) => ({ ...base, ...s, seriesId })) });
  }

  revalidatePath("/agenda");
  redirect(`/agenda?data=${d.date}`);
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
