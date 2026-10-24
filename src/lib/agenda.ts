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

/** Um atendimento comporta até 2 pacientes no mesmo horário, com o mesmo profissional e a mesma sala. */
export const MAX_PATIENTS_PER_SESSION = 2;

type ConflictCheck = {
  slots: Slot[];
  roomId: string;
  professionalId: string;
  patientIds: string[];
  ignoreIds?: string[];
  /** Permite juntar os pacientes a um atendimento já marcado no mesmo horário (dupla). */
  allowSharing?: boolean;
};

/**
 * Procura sessões que se sobrepõem a algum dos horários na mesma sala,
 * com o mesmo profissional ou com algum dos pacientes.
 *
 * Com allowSharing, uma sessão no mesmo horário exato, com o mesmo profissional e a mesma
 * sala, não é conflito enquanto o atendimento tiver vaga (dupla).
 */
export async function findConflicts({ slots, roomId, professionalId, patientIds, ignoreIds = [], allowSharing = false }: ConflictCheck) {
  if (slots.length === 0) return [];
  const overlap: Prisma.AppointmentWhereInput[] = slots.map((s) => ({ startsAt: { lt: s.endsAt }, endsAt: { gt: s.startsAt } }));
  const found = await db.appointment.findMany({
    where: {
      id: { notIn: ignoreIds },
      status: { in: OCCUPYING },
      OR: [{ roomId }, { professionalId }, { patientId: { in: patientIds } }],
      AND: [{ OR: overlap }],
    },
    include: { room: true, professional: true, patient: true },
    orderBy: { startsAt: "asc" },
  });

  const sameSession = (a: (typeof found)[number]) =>
    allowSharing &&
    a.professionalId === professionalId &&
    a.roomId === roomId &&
    !patientIds.includes(a.patientId) &&
    slots.some((s) => s.startsAt.getTime() === a.startsAt.getTime() && s.endsAt.getTime() === a.endsAt.getTime());

  // Quantos pacientes já ocupam cada horário compatível.
  const taken = new Map<number, number>();
  for (const a of found) if (sameSession(a)) taken.set(a.startsAt.getTime(), (taken.get(a.startsAt.getTime()) ?? 0) + 1);

  return found
    .filter((a) => !sameSession(a) || (taken.get(a.startsAt.getTime()) ?? 0) + patientIds.length > MAX_PATIENTS_PER_SESSION)
    .slice(0, 5);
}
