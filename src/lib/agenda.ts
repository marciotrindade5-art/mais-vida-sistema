import type { AppointmentStatus, Prisma } from "@prisma/client";
import { db } from "./db";

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  AGENDADO: "A confirmar",
  CONFIRMADO: "Confirmado",
  REALIZADO: "Realizado",
  FALTA: "Falta",
  CANCELADO: "Cancelado",
};

/** Situações que ocupam a sala e a agenda do profissional. */
export const OCCUPYING: AppointmentStatus[] = ["AGENDADO", "CONFIRMADO", "REALIZADO", "FALTA"];

export type Slot = { startsAt: Date; endsAt: Date };

type ConflictCheck = {
  slots: Slot[];
  roomId: string;
  professionalId: string;
  patientId: string;
  ignoreIds?: string[];
};

/**
 * Procura sessões que se sobrepõem a algum dos horários na mesma sala,
 * com o mesmo profissional ou com o mesmo paciente.
 */
export async function findConflicts({ slots, roomId, professionalId, patientId, ignoreIds = [] }: ConflictCheck) {
  if (slots.length === 0) return [];
  const overlap: Prisma.AppointmentWhereInput[] = slots.map((s) => ({ startsAt: { lt: s.endsAt }, endsAt: { gt: s.startsAt } }));
  return db.appointment.findMany({
    where: {
      id: { notIn: ignoreIds },
      status: { in: OCCUPYING },
      OR: [{ roomId }, { professionalId }, { patientId }],
      AND: [{ OR: overlap }],
    },
    include: { room: true, professional: true, patient: true },
    orderBy: { startsAt: "asc" },
    take: 5,
  });
}
